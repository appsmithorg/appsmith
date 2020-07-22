#!/bin/bash

set -o errexit

if [[ $EUID > 0 ]]; then
    echo "Please run with sudo." >&2
    exit 1
fi

install_package() {
    sudo apt-get -y update --quiet 
    sudo apt-get install -y ntp bc python3-pip --quiet
    pip3 install boto3
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common virtualenv python3-setuptools --quiet

    # Installing docker
    sudo apt-get  -y --quiet install gnupg-agent
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"

    sudo apt-get -y update --quiet
    sudo apt-get -y install docker-ce docker-ce-cli containerd.io --quiet

    # Installing docker compose
    if [ ! -f /usr/bin/docker-compose ];then
         echo "Installing docker-compose"
         sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
         sudo chmod +x /usr/local/bin/docker-compose
         sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
     fi

}

install_package

#Download boot.sh and schedule at boot time.
app_path="/home/ubuntu/appsmith"
script_path="script"
boot_script_path=$app_path/$script_path
boot_file_name="boot.sh"
config_ssl_file_name="configure-ssl.sh"
mkdir -p $boot_script_path
sudo chown -R ubuntu:ubuntu $app_path
cd $boot_script_path

sudo curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/configure-ssl.sh
sudo chown ubuntu:ubuntu $boot_script_path/$config_ssl_file_name && sudo chmod +x $boot_script_path/$config_ssl_file_name

sudo curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/aws/boot.sh
sudo chown ubuntu:ubuntu $boot_script_path/$boot_file_name && sudo chmod +x $boot_script_path/$boot_file_name

USER="ubuntu"
CRON_FILE="/var/spool/cron/crontabs/$USER"
echo "@reboot /bin/bash $boot_script_path/$boot_file_name" >> $CRON_FILE
sudo chmod 0600 $CRON_FILE
