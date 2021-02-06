resource "aws_instance" "appsmith_instance" {
  ami           = var.ami
  instance_type = var.instance_type
  key_name      = var.key_pair

  subnet_id = aws_subnet.appsmith_subnet_public_a.id
  vpc_security_group_ids = [
    aws_security_group.appssmith_sg.id,
  ]

  tags = {
    Name = "${var.environment}_instance"
  }
}
