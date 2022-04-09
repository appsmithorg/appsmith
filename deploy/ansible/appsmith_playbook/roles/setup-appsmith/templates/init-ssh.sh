#!/bin/bash

authorized_keys_path=/home/appsmith/.ssh/authorized_keys
if [[ ! -e "$authorized_keys_path" ]]; then
		echo "Setting SSH key"
		sudo cp ~/.ssh/authorized_keys "$authorized_keys_path"
		sudo chown appsmith:appsmith "$authorized_keys_path"
fi
