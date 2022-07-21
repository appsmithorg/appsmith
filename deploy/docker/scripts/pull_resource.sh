#!/bin/bash

install_dir="$1"

echo "Installing Appsmith to '$install_dir'"

if [[ -d "$install_dir" && -n "$(ls -A "$install_dir")" ]]; then
    echo "***************** ERROR *****************"
    echo "Directory "$install_dir" exists"
    exit 1
else
    mkdir -p "$install_dir"
    mkdir -p "$install_dir/stacks/configuration"
    mkdir -p "$install_dir/stacks/data/restore"
    mkdir -p "$install_dir/stacks/letsencrypt"
fi

echo "Start pull docker-compose.yml"
cd "$install_dir"
curl -s https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/aws_ami/docker-compose.yml --output docker-compose.yml