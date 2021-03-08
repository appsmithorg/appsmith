#!/bin/bash
set -e

# Install AWS CLI
sudo apt -y install unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install --update

# Install terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt -y update && sudo apt -y install terraform

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -LO "https://dl.k8s.io/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
echo "$(<kubectl.sha256) kubectl" | sha256sum --check
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install expect
sudo apt -y install expect

# Generate variables.tf of terraform
cat <<EOF >$GITHUB_WORKSPACE/deploy/test-scripts/k8s/terraform/variables.tf
## Required variables configuration ##

variable "profile" {
  description = "Aws Credentials Profile name"
  default     = "terraform_iam_user"
}

variable "environment" {
  description = "Your Environment, (prod, development, ... )"
  default     = "development"
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

variable "az_a" {
  description = "Availability Zone A"
  default     = "ap-south-1a"
}

variable "az_b" {
  description = "Availability Zone B"
  default     = "ap-south-1b"
}
EOF

# Run terrform
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

# Get cluster namme
cluster_name=$(head -n 1 $GITHUB_WORKSPACE/deploy/test-scripts/k8s/cluster_name.txt)

# Get region
region=$(head -n 1 $GITHUB_WORKSPACE/deploy/test-scripts/k8s/region.txt)

# Connect to EKS
aws eks --region $region update-kubeconfig --name $cluster_name

# Install nginx ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.43.0/deploy/static/provider/aws/deploy.yaml

# Wait for SSL certificate for the validation webhook
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Create disable-analytics.sh file
cd ..
cat >$GITHUB_WORKSPACE/deploy/k8s/disable_analytics.sh <<EOF
chmod +x $INSTALL_DIR/config-template/appsmith-configmap.yaml
echo '  APPSMITH_SEGMENT_CE_KEY: ""' >>$INSTALL_DIR/config-template/appsmith-configmap.yaml
EOF

# Run install.k8s.sh
$GITHUB_WORKSPACE/deploy/test-scripts/k8s/script.exp

wait_for_containers_start() {
  local timeout=$1

  while [[ $timeout -gt 0 ]]; do
    echo "Waiting for app to start. This check will timeout in $timeout seconds..."
    ((timeout--))
    sleep 1
  done
}

wait_for_containers_start 120
