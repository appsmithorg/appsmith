resource "local_file" "public_ip" {
  content              = aws_instance.appsmith_instance.public_ip
  filename             = "../public_ip.txt"
  directory_permission = "0600"
  file_permission      = "0600"
}
