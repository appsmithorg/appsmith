resource "local_file" "cluster_name" {
  content              = aws_eks_cluster.appsmith_eks_cluster.name
  filename             = "../cluster_name.txt"
  directory_permission = "0600"
  file_permission      = "0600"
}

resource "local_file" "region" {
  content              = var.region
  filename             = "../region.txt"
  directory_permission = "0600"
  file_permission      = "0600"
}
