#!/bin/bash

start_docker() {
    if [ `systemctl is-active docker.service` == "inactive" ];then
        echo "Starting docker"
        `systemctl start docker.service`
    fi
}


# generate random string
generte_random_string() {
    value=`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 10 | head -n 1`
    echo $value
}
#va=$( generte_random_string )

install_dir="/root/appsmith"

if [ ! -d $install_dir ];then
    mkdir -p $install_dir
fi

# Above code tested


mongo_host="mongo"
mongo_database="appsmith"
mongo_root_user=$( generte_random_string )
mongo_root_password=$( generte_random_string )
user_encryption_password=$( generte_random_string )
user_encryption_salt=$( generte_random_string )

custom_domain=""
NGINX_SSL_CMNT=""
if [[ -z $custom_domain ]]; then
    NGINX_SSL_CMNT="#"
fi

script_dir="/root/script/"
if [ ! -d $script_dir ];then
    mkdir -p $script_dir
fi

cd $script_dir
echo $PWD
mkdir -p template
cd template
echo $PWD
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker-compose.yml.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/init-letsencrypt.sh.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/mongo-init.js.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker.env.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/nginx_app.conf.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/encryption.env.sh
cd ..
echo $PWD

# Role - Folder
for directory_name in nginx certbot mongo/db opa/config appsmith-server/config
do
  if [[ ! -d "$install_dir/data/$directory_name" ]];then
    mkdir -p "$install_dir/data/$directory_name"
  fi
done

echo "Generating the configuration files from the templates"
. ./template/nginx_app.conf.sh
. ./template/docker-compose.yml.sh
. ./template/mongo-init.js.sh
. ./template/docker.env.sh
. ./template/encryption.env.sh

declare -A fileInfo

fileInfo[/data/nginx/app.conf]="nginx_app.conf"
fileInfo[/docker-compose.yml]="docker-compose.yml"
fileInfo[/data/mongo/init.js]="mongo-init.js"
fileInfo[/docker.env]="docker.env"
fileInfo[/encryption.env]="encryption.env"

for f in ${!fileInfo[@]}
do
    mv -f  ${fileInfo[$f]} $install_dir$f
done

cd $install_dir
echo "Pull Images: $PWD"
sudo docker-compose pull

echo "docker compose $PWD"
sudo docker-compose -f docker-compose.yml up -d --remove-orphans