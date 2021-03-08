#!/bin/bash

set -e

# Store private key to id_rsa file on runner
key_path="$(pwd)/keys"
mkdir -p $key_path
echo "$SSH_PRIVATE_KEY" | tr -d '\r' >$key_path/id_rsa
chmod 400 $key_path/id_rsa

# Install Ansible
sudo apt -y update
sudo apt -y install software-properties-common
sudo apt-add-repository --yes --update ppa:ansible/ansible
sudo apt -y install ansible

# Install python3 & pip
sudo apt -y install python3-pip python3-setuptools
pip3 install boto boto3 botocore --user

# Generate variables.yml
cat <<EOF >$GITHUB_WORKSPACE/deploy/test-scripts/aws-ami/aws_ami_ansible_playbook/variables.yml
install_dir: '/home/ubuntu'
default_key: '$AWS_KEY_PAIR_NAME'
path_to_ssh_key: '$key_path/id_rsa'
default_security_group_id: 'sg-0624213b30aca0795'
default_subnet_id: 'subnet-26ac3f6a'
default_ami_id: 'ami-0a4a70bd98c6d6441' #Ubuntu 20.04
default_instance_type_id: 't2.micro'
default_region_id: 'ap-south-1'
ami_name: 'appsmith_ami_for_test'
EOF

# Run ansible playbook
cd aws_ami_ansible_playbook
ansible-playbook -i inventory main.yml --extra-var="@variables.yml"

wait_for_containers_start() {
    local timeout=$1

    while [[ $timeout -gt 0 ]]; do
        echo "Waiting for app to start. This check will timeout in $timeout seconds..."
        ((timeout--))
        sleep 1
    done
}

wait_for_containers_start 180
