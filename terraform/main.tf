terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Use the account's default VPC/subnets (no NAT gateway = no extra cost) ──
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Amazon Linux 2023 (x86_64)
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── Security group: HTTP open to all; SSH only if a key is provided ─────────
resource "aws_security_group" "app" {
  name        = "${var.project_name}-sg"
  description = "CodeCampus app (HTTP + optional SSH)"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.ssh_public_key == "" ? [] : [1]
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.allowed_ssh_cidr]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Project = var.project_name }
}

# Optional SSH key pair
resource "aws_key_pair" "this" {
  count      = var.ssh_public_key == "" ? 0 : 1
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key
}

# Stable public IP
resource "aws_eip" "this" {
  domain = "vpc"
  tags   = { Project = var.project_name }
}

# ── The single instance that runs db + backend + frontend via Docker ────────
resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = true
  key_name                    = var.ssh_public_key == "" ? null : aws_key_pair.this[0].key_name

  root_block_device {
    volume_size           = var.root_volume_gb
    volume_type           = "gp3"
    delete_on_termination = false
  }

  credit_specification {
    cpu_credits = "standard"
  }

  lifecycle {
    prevent_destroy = true
  }

  user_data = templatefile("${path.module}/userdata.sh.tftpl", {
    repo_url     = var.repo_url
    repo_branch  = var.repo_branch
    github_token = var.github_token
    db_password  = var.db_password
    jwt_secret   = var.jwt_secret
    frontend_url = "http://${aws_eip.this.public_ip}"
  })

  tags = { Project = var.project_name, Name = "${var.project_name}-app" }
}

resource "aws_eip_association" "this" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.this.id
}
