#!/bin/bash

set -e

# Store private key to id_rsa file on runner
key_path="$(pwd)/keys"
mkdir -p $key_path
echo "$SSH_PRIVATE_KEY" | tr -d '\r' >$key_path/id_rsa
chmod 400 $key_path/id_rsa

# Install terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt -y update && sudo apt -y install terraform

# Generate variables.tf
cat <<EOF >$GITHUB_WORKSPACE/deploy/test-scripts/docker-compose/terraform/variables.tf
## Required variables configuration ##

variable "profile" {
  description = "AWS Credentials Profile name"
  default     = "terraform_iam_user"
}

variable "environment" {
  description = "Your depoy environment (prod, development, ... )"
  default     = "dev"
}

variable "key_pair" {
  description = "Name of key pair"
  default     = "$AWS_KEY_PAIR_NAME"
}

variable "ami" {
  description = "AMI for server, default ubuntu 20.04 have expect package installed"
  default     = "ami-05e84e6cd78e34713"
}
variable "region" {
  description = "Region that the instances will be created"
  default     = "ap-south-1"
}

## Default variables configuration ##
# Bastion instance configuration
variable "vpc_id" {
  description = "Default vpc_id"
  default     = "vpc-41b8bd29"
}
variable "instance_type" {
  description = "Instance type for server"
  default     = "t2.micro"
}

# VPC configuration
variable "az_a" {
  description = "Availability Zone A"
  default     = "ap-south-1a"
}
EOF

# Run terrform
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

# Get instance public ip
instance_ip=$(head -n 1 $GITHUB_WORKSPACE/deploy/test-scripts/docker-compose/public_ip.txt)

sleep 30

# Remove lock file
ssh -oStrictHostKeyChecking=no -i $key_path/id_rsa ubuntu@$instance_ip "sudo rm /var/lib/dpkg/lock && sudo rm /var/lib/apt/lists/lock && sudo rm /var/cache/apt/archives/lock"

# Copy install.sh to server
scp -oStrictHostKeyChecking=no -i $key_path/id_rsa $GITHUB_WORKSPACE/deploy/install.sh ubuntu@$instance_ip:/home/ubuntu

# Copy disable-analytics.sh to server
scp -i $key_path/id_rsa $GITHUB_WORKSPACE/deploy/test-scripts/docker-compose/disable-analytics.sh ubuntu@$instance_ip:/home/ubuntu

# Copy autoscript to server
scp -i $key_path/id_rsa $GITHUB_WORKSPACE/deploy/test-scripts/docker-compose/script.exp ubuntu@$instance_ip:/home/ubuntu

# Run exp sript on server
ssh -i $key_path/id_rsa ubuntu@$instance_ip "bash -c 'chmod +x /home/ubuntu/script.exp && /home/ubuntu/script.exp'"
