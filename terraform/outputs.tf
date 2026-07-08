output "app_url" {
  description = "Open this in your browser once the instance finishes building (~8-12 min)."
  value       = "http://${aws_eip.this.public_ip}"
}

output "public_ip" {
  value = aws_eip.this.public_ip
}

output "ssh_command" {
  description = "How to SSH in (only works if you provided ssh_public_key)."
  value       = var.ssh_public_key == "" ? "SSH disabled (no ssh_public_key set)" : "ssh ec2-user@${aws_eip.this.public_ip}"
}
