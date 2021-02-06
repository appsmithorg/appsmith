#!/bin/bash

# Destroy nginx ingress
kubectl delete ns ingress-nginx

# Destroy EKS
cd terraform
terraform destroy -auto-approve

# Remove generated variables.tf
rm variables.tf
