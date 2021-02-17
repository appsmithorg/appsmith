#!/bin/bash

# Get instance_id
instance_id=$(head -n 1 $GITHUB_WORKSPACE/deploy/test-scripts/aws-ami/instance_id.txt)

# Get ami_id
ami_id=$(head -n 1 $GITHUB_WORKSPACE/deploy/test-scripts/aws-ami/ami_id.txt)

# Remove variables.yml of aws_ami
rm $GITHUB_WORKSPACE/deploy/test-scripts/aws-ami/aws_ami_ansible_playbook/variables.yml

# Generate variables.yml
cat <<EOF >$GITHUB_WORKSPACE/deploy/test-scripts/aws-ami/teardown_aws_ami_ansible_playbook/variables.yml
default_region_id: 'ap-south-1'
ami_id: '$ami_id'
instance_id: '$instance_id'
EOF

# Unregister AMI
cd teardown_aws_ami_ansible_playbook
ansible-playbook -i inventory main.yml --extra-var="@variables.yml"

# Remove generated variables.yml
rm variables.yml
