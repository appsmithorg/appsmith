#!/bin/bash
if git config --get-all secrets.providers | grep aws; then
  echo "AWS is installed"
  git-secrets --scan -r
else
  echo "Error faced while checking secrets in commit"
  echo "  1) git secrets is not installed, please install git-secrets for your env"
  echo "  2) AWS configuration might not have been set, run the following command:"
  echo "     git secrets --register-aws"
  exit 1
fi