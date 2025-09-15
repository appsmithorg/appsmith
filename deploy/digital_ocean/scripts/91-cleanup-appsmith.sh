#!/bin/bash

# This script contains cleanups that we do beyond the upstream 90-cleanup.sh script provided by DigitalOcean.

# The DO agent appears to get installed when you start up a Droplet, but the 99-img_check.sh provided by them doesn't want it installed.
apt-get -y purge droplet-agent
