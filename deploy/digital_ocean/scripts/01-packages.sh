#!/bin/bash

# Add a swap file to prevent build time OOM errors
fallocate -l 8G /swapfile
mkswap /swapfile
swapon /swapfile

# update apt
apt-get -y update
apt-get -y upgrade

# install Digital Ocean agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | bash

# open ports
echo "y" | ufw enable
ufw allow http
ufw allow https
ufw allow ssh

# Disable and remove the swapfile prior to snapshotting
swapoff /swapfile
rm -f /swapfile