#!/bin/bash

# Remove private key
rm $(pwd)/keys/id_rsa

# Destroy infrastructure
cd terraform
terraform destroy -auto-approve

# Remove variables.tf
rm variables.tf
