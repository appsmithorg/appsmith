#!/bin/bash
set -o errexit

echo "" > appsmith_deploy.log

is_command_present() {
  type "$1" >/dev/null 2>&1
}

install_docker() {
    if [[ $package_manager -eq apt-get ]];then
        echo "++++++++++++++++++++++++"
        echo "Setting up docker repos"
        sudo $package_manager update  --quiet

        sudo apt-get  -y --quiet install gnupg-agent
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository \
        "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) \
        stable"
    else
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    fi

    sudo ${package_manager} -y update --quiet
    echo "Installing docker"
    sudo ${package_manager} -y install docker-ce docker-ce-cli containerd.io --quiet --nobest
   
    if [ ! -f /usr/bin/docker-compose ];then
        echo "Installing docker-compose"
        sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi

}

start_docker() {
    if [ `systemctl is-active docker.service` == "inactive" ];then
        echo "Starting docker"
        `systemctl start docker.service`
    fi
}

echo -e "\U1F44B  Thank you for trying out Appsmith! "
echo ""

declare -A osInfo;

osInfo[/etc/debian_version]="apt-get"
osInfo[/etc/centos-release]="yum"
osInfo[/etc/redhat-release]="yum"

# Checking OS and assiging package manager
desired_os=0
echo -e "\U1F575  Detecting your OS"
echo ""
for f in ${!osInfo[@]}
do
    if [[ -f $f ]];then
        package_manager=${osInfo[$f]}
        desired_os=1
    fi
done

if [[ $desired_os -eq 0 ]];then
    echo "This script is currently meant to install Appsmith on Ubuntu | RHEL | CentOS machines."
    echo "Please contact hello@appsmith.com with your OS details if you wish to extend this support"
    echo -e "Exiting for now. Bye! \U1F44B"
    exit
fi

read -p 'Installation Directory [appsmith]: ' install_dir
install_dir=${install_dir:-appsmith}
mkdir -p $PWD/$install_dir
install_dir=$PWD/$install_dir
echo "Appsmith needs a mongodb instance to run"
echo "1) Automatically setup mongo db on this instance (recommended)"
echo "2) Connect to an external mongo db"
read -p 'Enter option number [1]: ' mongo_option
mongo_option=${mongo_option:-1}

if [[ $mongo_option -eq 2 ]];then
    read -p 'Enter your mongo db host: ' mongo_host
    read -p 'Enter the mongo root user: ' mongo_root_user
    read -sp 'Enter the mongo password: ' mongo_root_password
    read -p 'Enter your mongo database name: ' mongo_database
elif [[ $mongo_option -eq 1 ]];then
    mongo_host="mongo"
    mongo_database="appsmith"
    read -p 'Set the mongo root user: ' mongo_root_user
    read -sp 'Set the mongo password: ' mongo_root_password
fi
echo ""
read -p 'Would you like to host appsmith on a custom domain / subdomain? [Y/n]: ' setup_domain
setup_domain=${setup_domain:-Y}
if [ $setup_domain == "Y" -o $setup_domain == "y" -o $setup_domain == "yes" -o $setup_domain == "Yes" ];then
    echo "+++++++++++++++++++++++++++++++++"
    echo "Please update your DNS records with your domain registrar"
    echo "You can read more about this in our Documentation"
    echo "https://docs.appsmith.com/v/v1.1/quick-start#custom-domains"
    echo "+++++++++++++++++++++++++++++++++"
    echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
    read -p '(Your DNS records must be updated for us to provision SSL) [Y/n]: ' setup_ssl
    setup_ssl=${setup_ssl:-Y}
fi

if [ $setup_ssl == "Y" -o $setup_ssl == "y" -o $setup_ssl == "yes" -o $setup_ssl == "Yes" ];then
	read -p 'Enter your domain / subdomain name (example.com / app.example.com): ' custom_domain
fi

NGINX_SSL_CMNT=""
if [[ -z $custom_domain ]]; then
    NGINX_SSL_CMNT="#"
fi

mkdir -p template
cd template
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker-compose.yml.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/init-letsencrypt.sh.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/mongo-init.js.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker.env.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/nginx_app.conf.sh
cd ..

# Role - Docker
if ! is_command_present docker ;then
    install_docker
fi

# Starting docker service
start_docker

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
. ./template/init-letsencrypt.sh.sh
. ./template/docker.env.sh
chmod 0755 init-letsencrypt.sh

declare -A fileInfo

fileInfo[/data/nginx/app.conf]="nginx_app.conf"
fileInfo[/docker-compose.yml]="docker-compose.yml"
fileInfo[/data/mongo/init.js]="mongo-init.js"
fileInfo[/init-letsencrypt.sh]="init-letsencrypt.sh"
fileInfo[/docker.env]="docker.env"

for f in ${!fileInfo[@]}
do

    if [ -f $install_dir/$f ]
    then
        read -p "File $f already exist. Would you like to replace it? [Y]: " value

        if [ $value == "Y" -o $value == "y" -o $value == "yes" -o $value == "Yes" ]
        then
            mv -f  ${fileInfo[$f]} $install_dir$f
            echo "File $install_dir$f replaced succeffuly!"
        else
            echo "You choose not to replae existing file: $install_dir$f"
	    rm -rf ${fileInfo[$f]}
	    echo "File ${fileInfo[$f]} removed from source directory."
        echo ""
        fi
    else
        mv -f ${fileInfo[$f]} $install_dir$f
    fi

done


echo ""

#echo "Running init-letsencrypt.sh...."
cd $install_dir
if [[ ! -z $custom_domain ]]; then
    echo "Running init-letsencrypt.sh...."
    sudo ./init-letsencrypt.sh
else
    echo "No domain found. Skipping generation of LetsEncrypt certificate."
fi

echo "Updating the container images"
sudo docker-compose pull
echo "Starting the Appsmith containers"
sudo docker-compose -f docker-compose.yml up -d --remove-orphans
echo ""
echo "Your installation is complete. Please run the following command to ensure that all the containers are running without errors"
echo "              cd $install_dir && sudo docker-compose ps -a"
echo -e "Peace out \U1F596"
echo ""
echo "Need help troubleshooting?"
echo "Join our discord server https://discord.com/invite/rBTTVJp"