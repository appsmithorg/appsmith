#!/bin/bash
set -o errexit

echo "" > appsmith_deploy.log

declare -A osInfo;

osInfo[/etc/debian_version]="apt-get"
osInfo[/etc/centos-release]="yum"
osInfo[/etc/redhat-release]="yum"

# Checking OS and assiging package manager
desired_os=0
echo "Assigning package manager"
for f in ${!osInfo[@]}
do
    if [[ -f $f ]];then
        package_manager=${osInfo[$f]}
        echo $package_manager
        desired_os=1
    fi
done

if [[ $desired_os -eq 0 ]];then
    echo "This script is currently meant to install Appsmith on Ubuntu | RHEL | CentOS machines."
    echo "Please contact hello@appsmith.com with your OS details if you wish to extend this support"
    echo "Exiting for now. Bye!"
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
read -p 'Would you like to setup a custom domain to access appsmith? [Y/n]: ' setup_domain
setup_domain=${setup_domain:-Y}

if [ $setup_domain == "Y" -o $setup_domain == "y" -o $setup_domain == "yes" -o $setup_domain == "Yes" ];then
	read -p 'Enter your domain name (example.com): ' custom_domain
fi

NGINX_SSL_CMNT=""
if [ ! $custom_domain ];then
    NGINX_SSL_CMNT="#"
fi

#mkdir template
#cd template
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/docker-compose.yml.sh --output docker-compose.yml.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/init-letsencrypt.sh.sh --output init-letsencrypt.sh.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/mongo-init.js.sh --output mongo-init.js.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/nginx_app.conf.sh --output nginx_app.conf.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/nginx_app.conf.sh --output nginx_app.conf.sh
#cd ..

# Role - Base
echo "Installing base dependency packages"
sudo ${package_manager} -y install bc python3-pip curl --quiet

# Role - Docker
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
sudo ${package_manager} -y install docker-ce docker-ce-cli containerd.io --quiet

echo "Installing docker-compose"
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Role - folders
ubuntu="/etc/debian_version"
centos="/etc/centos-release"
redhat="/etc/redhat-release"

if [ -f $ubuntu ]
then
    user="ubuntu"
    group="ubuntu"
elif [ -f $centos ]
then
   user="centos"
   group="centos"
elif [ -f $redhat ]
then
   user="redhat"
   group="redhat"
fi

for directory_name in nginx certbot mongo/db opa/config appsmith-server/config
do
  if [ -d "$install_dir/data/$directory_name" ]
  then
    echo "Directory already exists"
  else
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

    if [ -f $install_dir$f ]
    then
        echo "File already exist."
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


echo "++++++++++++++++++++"

#echo "Running init-letsencrypt.sh...."
cd $install_dir
if [ $custom_domain ];then
    echo "Running init-letsencrypt.sh...."
    sudo ./init-letsencrypt.sh
else
    echo "Skipping LE certificate."
fi

sudo docker-compose -f docker-compose.yml up -d --remove-orphans