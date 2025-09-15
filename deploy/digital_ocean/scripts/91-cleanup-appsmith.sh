#!/bin/bash

# This script contains cleanups that we do beyond the upstream 90-cleanup.sh script provided by DigitalOcean.

# The DO agent appears to get installed when you start up a Droplet, but the 99-img_check.sh provided by them doesn't want it installed.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if dpkg -s droplet-agent >/dev/null 2>&1; then
  apt-get -y purge droplet-agent
fi
# Some images used to ship "do-agent"
if dpkg -s do-agent >/dev/null 2>&1; then
  apt-get -y purge do-agent
fi
apt-get -y autoremove
apt-get -y autoclean
# Ensure directory is gone to satisfy 99-img_check.sh
rm -rf /opt/digitalocean || true
