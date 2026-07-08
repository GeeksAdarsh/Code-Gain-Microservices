variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-north-1" # Stockholm (matches your console)
}

variable "project_name" {
  description = "Name prefix for created resources."
  type        = string
  default     = "codecampus"
}

variable "instance_type" {
  description = "EC2 size. t3.small (2GB) builds reliably; t3.micro (1GB) is cheaper but tighter."
  type        = string
  default     = "t3.small"
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 20
}

variable "repo_url" {
  description = "Git repo the instance clones and builds."
  type        = string
  default     = "https://github.com/GeeksAdarsh/Code_Campus-Compiler.git"
}

variable "github_token" {
  description = "GitHub fine-grained PAT (Contents: read-only) to clone a PRIVATE repo. Leave empty for public repos."
  type        = string
  default     = ""
  sensitive   = true
}

variable "repo_branch" {
  description = "Branch to deploy."
  type        = string
  default     = "main"
}

variable "ssh_public_key" {
  description = "Your SSH public key (contents of ~/.ssh/id_ed25519.pub). Leave empty to skip SSH access."
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH (port 22). Set to YOUR_IP/32 for safety."
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_password" {
  description = "MySQL root password used inside the instance."
  type        = string
  default     = "codecampus123"
  sensitive   = true
}

variable "jwt_secret" {
  description = "Base64-encoded JWT secret (>=256-bit)."
  type        = string
  default     = "Q29kZUNhbXB1czIwMjZTdXBlclNlY3JldEtleUxvbmdFbm91Z2hGb3JIUzI1NkFsZ29yaXRobQ=="
  sensitive   = true
}
