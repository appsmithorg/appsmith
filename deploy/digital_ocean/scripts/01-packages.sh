#!/bin/bash

# Add a swap file to prevent build time OOM errors
fallocate -l 8G /swapfile
mkswap /swapfile
swapon /swapfile

# add CRAN to apt sources
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
printf '\n#CRAN mirror\ndeb https://cloud.r-project.org/bin/linux/ubuntu focal-cran40/\n' | tee -a /etc/apt/sources.list

# update apt
apt-get -y update
apt-get -y upgrade

# install Digital Ocean agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash

# open ports
ufw allow http
ufw allow https
ufw allow ssh

# Disable and remove the swapfile prior to snapshotting
swapoff /swapfile
rm -f /swapfile