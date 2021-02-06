#!/bin/bash

# Remove private key
rm $(pwd)/keys/id_rsa

# Destroy infrastructure
cd terraform
terraform destroy -auto-approve

# Remove variables.tf of terraform
rm variables.tf

# Remove inventory
rm $CI_PROJECT_DIR/deploy/ansible/appsmith_playbook/inventory
