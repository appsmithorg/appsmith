#!/bin/bash
set -x
# Install necessary dependencies
sudo apt-get -y -qq install curl wget git vim apt-transport-https ca-certificates
# Create an user group
sudo groupadd -r appsmith
# Add myuser to appsmith
sudo usermod -a -G appsmith appsmith
 
# Grant privileges to myuser to run any command on the system 
echo "appsmith ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/appsmith