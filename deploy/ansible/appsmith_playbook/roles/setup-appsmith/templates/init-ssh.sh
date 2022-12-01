#!/bin/bash

authorized_keys_path=/home/appsmith/.ssh/authorized_keys
if [[ ! -e "$authorized_keys_path" ]]; then
		echo "Setting SSH key"
		sudo cp ~/.ssh/authorized_keys "$authorized_keys_path"
		sudo chown appsmith:appsmith "$authorized_keys_path"
fi

authorized_keys_ubuntu_path=/home/ubuntu/.ssh/authorized_keys
if [[ ! -e "$authorized_keys_ubuntu_path" ]]; then
		echo "Setting SSH key for ubuntu user"
		sudo mkdir -p /home/ubuntu/.ssh/
		sudo chmod -R 700 /home/ubuntu/.ssh/
		sudo cp ~/.ssh/authorized_keys "$authorized_keys_ubuntu_path"
		sudo chown -R ubuntu:appsmith /home/ubuntu/.ssh/
fi