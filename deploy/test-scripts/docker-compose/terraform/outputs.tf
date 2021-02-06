output "instance_public_ip" {
  value = aws_instance.appsmith_instance.public_ip
}
