#!/bin/bash

set -e

# Store private key to id_rsa file on runner
key_path="$(pwd)/keys"
mkdir -p $key_path
echo "$SSH_PRIVATE_KEY" | tr -d '\r' > $key_path/id_rsa
chmod 400 $key_path/id_rsa

# Install Ansible
sudo apt -y update
sudo apt -y install software-properties-common
sudo apt-add-repository --yes --update ppa:ansible/ansible
sudo apt -y install ansible

# Install python3 & pip
sudo apt -y install python3-pip python3-setuptools
pip3 install boto boto3 botocore --user

# Install terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt -y update && sudo apt -y install terraform

wait_for_containers_start() {
    local timeout=$1

    while [[ $timeout -gt 0 ]]; do
        echo "Waiting for app to start. This check will timeout in $timeout seconds..."
        ((timeout--))
        sleep 1
    done
}

# Generate variables.tf of terraform
cat <<EOF >$GITHUB_WORKSPACE/deploy/test-scripts/ansible/terraform/variables.tf
## Required variables configuration ##
variable "profile" {
  description = "Aws Credentials Profile name"
  default     = "terraform_iam_user"
}

variable "environment" {
  description = "Your Environment, (prod, development, ... )"
  default     = "development"
}

variable "key_pair" {
  description = "Name of key pair"
  default     = "$AWS_KEY_PAIR_NAME"
}

variable "ami" {
  description = "AMI for server, default ubuntu 20.04"
  default     = "ami-0a4a70bd98c6d6441"
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

# Run terraform
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

# Get EC2 instance public IP
instance_ip=$(head -n 1 $GITHUB_WORKSPACE/deploy/test-scripts/ansible/public_ip.txt)


# Store EC2 instance public IP to ansible playbook's inventory
echo "appsmith ansible_host=$instance_ip ansible_port=22 ansible_user=ubuntu ansible_ssh_private_key_file=$key_path/id_rsa ansible_ssh_common_args='-o StrictHostKeyChecking=no'" >$GITHUB_WORKSPACE/deploy/ansible/appsmith_playbook/inventory

# Generate appsmith-vars.yml
cat <<EOF >$GITHUB_WORKSPACE/deploy/ansible/appsmith_playbook/appsmith-vars.yml
---
user_email: 'youremail@appsmith.com'
install_dir: '/home/ubuntu/appsmith'
mongo_host: 'mongo'
mongo_root_user: 'admin'
mongo_root_password: 'admin'
mongo_database: 'appsmith'
user_encryption_password: 'test'
user_encryption_salt: 'test123'
custom_domain: ''
ssl_enable: 'false'
letsencrypt_email: 'youremail@appsmith.com'
is_ssl_staging: 'false'
disable_telemetry: 'true'
mail_enabled: 'false'
mail_from: ''
mail_to: ''
mail_host: ''
mail_port: '' 
mail_ssl_enabled: 'false'
mail_username: ''
mail_password: ''
mail_auth: ''
google_client_id: ''
google_secret_id: ''
github_client_id: ''
github_secret_id: ''
google_maps_api_key: ''
sentry_dns: ''
smart_look_id: ''
marketplace_enabled: 'false'
segment_key: ''
optimizely_key: ''
algolia_api_id: ''
algolia_search_index_name: ''
algolia_api_key: ''
client_log_level: ''
tnc_pp: ''
version_id: ''
version_release_date: ''
intercom_app_id: ''
disable_analytics: 'true'
EOF

wait_for_containers_start 60

# Run Ansible
cd $GITHUB_WORKSPACE/deploy/ansible/appsmith_playbook
ansible-playbook -i inventory main.yml --extra-var "@appsmith-vars.yml"

wait_for_containers_start 90
