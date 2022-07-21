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
    sudo usermod -aG docker $USER

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
script_path="scripts"

boot_script_path=$app_path/$script_path

cloud_init_script_path="/var/lib/cloud/scripts/per-instance"

boot_file_name="boot.sh"
first_time_setup_file_name="first-time-setup.sh"
user_data_script="user-data.sh"

mkdir -p $boot_script_path
sudo chown -R ubuntu:ubuntu $app_path
cd $boot_script_path

sudo curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/aws_ami/boot.sh
sudo curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/aws_ami/first-time-setup.sh
sudo curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/aws_ami/user-data.sh

sudo chown ubuntu:ubuntu $boot_script_path/$boot_file_name && sudo chmod +x $boot_script_path/$boot_file_name
sudo chown ubuntu:ubuntu $boot_script_path/$first_time_setup_file_name && sudo chmod +x $boot_script_path/$first_time_setup_file_name
sudo chown root:root $boot_script_path/$user_data_script && sudo chmod +x $boot_script_path/$user_data_script

CRON_FILE="/etc/cron.d/appsmith"
echo "@reboot $USER $boot_script_path/$boot_file_name" > $CRON_FILE
sudo chmod 0600 $CRON_FILE

sudo mv $boot_script_path/$user_data_script $cloud_init_script_path



