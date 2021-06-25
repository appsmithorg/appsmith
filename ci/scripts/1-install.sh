#!/bin/bash

set -o errexit

apt-get update -y

# Installing `gettext-base` just for `envsubst` command.
apt-get install -y maven gettext-base curl
