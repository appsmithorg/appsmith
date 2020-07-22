#!/bin/bash
set -o errexit

read -p 'Enter your domain / subdomain name (example.com / app.example.com): ' custom_domain

NGINX_SSL_CMNT=""
install_dir="/home/ubuntu/appsmith"
TEMPLATE_PATH="$install_dir/script/template"

. $TEMPLATE_PATH/nginx_app.conf.sh
. $TEMPLATE_PATH/init-letsencrypt.sh.sh

chmod 0755 init-letsencrypt.sh

mv -f app.conf $install_dir/data/nginx/app.conf
mv -f init-letsencrypt.sh $install_dir/init-letsencrypt.sh

cd $install_dir
sudo ./init-letsencrypt.sh
