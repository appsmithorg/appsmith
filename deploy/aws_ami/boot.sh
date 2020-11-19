#!/bin/bash
set -o errexit
# Check if Lock File exists, if not create it and set trap on exit
if { set -C; 2>/dev/null >/home/ubuntu/.appsmith.lock; }; then
    trap "rm -f /home/ubuntu/.appsmith.lock" EXIT
else
    exit
fi

start_docker() {
    if [ `sudo systemctl is-active docker.service` == "inactive" ];then
        echo "Starting docker"
        sudo systemctl start docker.service
    fi
}
start_docker

install_dir="/home/ubuntu/appsmith"
# Check if Apsmith setup, if not create run setup up script
if [ ! -f $install_dir/docker-compose.yml ]; then
    echo ""
    echo "Setting Appsmith"
    first_time_setup_script=$install_dir/scripts/first-time-setup.sh 
    chmod +x $first_time_setup_script;
    /bin/bash $first_time_setup_script
else
    echo "Booting appsmith"
    cd $install_dir
    docker-compose up --detach --remove-orphans
fi
