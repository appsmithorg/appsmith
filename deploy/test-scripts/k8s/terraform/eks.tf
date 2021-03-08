resource "aws_eks_cluster" "appsmith_eks_cluster" {
  name     = "${var.environment}-cluster"
  role_arn = aws_iam_role.appsmith_iam.arn

  vpc_config {
    subnet_ids = [aws_subnet.appsmith_subnet_public_a.id, aws_subnet.appsmith_subnet_public_b.id]
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Cluster handling.
  # Otherwise, EKS will not be able to properly delete EKS managed EC2 infrastructure such as Security Groups.
  depends_on = [
    aws_iam_role_policy_attachment.example-AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.example-AmazonEKSVPCResourceController,
  ]
}

resource "aws_eks_node_group" "appsmith_eks_node_group" {
  cluster_name    = aws_eks_cluster.appsmith_eks_cluster.name
  node_group_name = "${var.environment}-node-group"
  node_role_arn   = aws_iam_role.appsmith_iam.arn
  subnet_ids      = [aws_subnet.appsmith_subnet_public_a.id, aws_subnet.appsmith_subnet_public_b.id]

  scaling_config {
    desired_size = 1
    max_size     = 1
    min_size     = 1
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Node Group handling.
  # Otherwise, EKS will not be able to properly delete EC2 Instances and Elastic Network Interfaces.
  depends_on = [
    aws_iam_role_policy_attachment.example-AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.example-AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.example-AmazonEC2ContainerRegistryReadOnly,
  ]
}
