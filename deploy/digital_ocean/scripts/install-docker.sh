#!/bin/bash

apt-get -y update --quiet
apt-get  -y --quiet install gnupg-agent
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
  add-apt-repository \
"deb [arch=amd64] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) \
stable"

apt-get -y update --quiet
apt-get -y install docker-ce docker-ce-cli containerd.io --quiet

curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose

groupadd docker

usermod -aG docker $USER