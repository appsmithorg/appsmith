#!/bin/bash
declare -A osInfo;

osInfo[/etc/debian_version]="apt-get"
osInfo[/etc/centos-release]="yum"
osInfo[/etc/redhat-release]="yum"

read -p 'install_dir [deploy]: ' install_dir
install_dir=${install_dir:-deploy}
mkdir -p $PWD/$install_dir
install_dir=$PWD/$install_dir
read -p 'mongo_host [mongo]: ' mongo_host
mongo_host=${mongo_host:-mongo}
read -p 'mongo_root_user: ' mongo_root_user
read -sp 'mongo_root_pass: ' mongo_root_password
echo ""
read -p 'mongo_database [appsmith]: ' mongo_database
mongo_database=${mongo_database:-appsmith}
read -p 'custom_domain: ' custom_domain

#mkdir template
#cd template
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/docker-compose.yml.sh --output docker-compose.yml.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/init-letsencrypt.sh.sh --output init-letsencrypt.sh.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/mongo-init.js.sh --output mongo-init.js.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/nginx_app.conf.sh --output nginx_app.conf.sh
#curl https://raw.githubusercontent.com/Nikhil-Nandagopal/test-rep/master/nginx_app.conf.sh --output nginx_app.conf.sh
#cd ..


# Checking OS and assiging package manager
desired_os=0
echo "Assiging package manager"
for f in ${!osInfo[@]}
do
    if [[ -f $f ]];then
        package_manager=${osInfo[$f]}
	echo $package_manager
	desired_os=1
    fi
done

if [[ desired_os -eq 0 ]];then
	echo "Desired OS(Ubuntu | RedHat | CentOS) is not found. Please run this script on Ubuntu | RedHat | CentOS.\nExiting now..."
	exit
fi

# Role - Base
echo "kill automatic updating script, if any"
pkill --full /usr/bin/unattended-upgrade > /dev/null 2>&1

echo "apt update"
sudo ${package_manager} -y update --quiet > /dev/null 2>&1

echo "Upgrade all packages to the latest version"
sudo ${package_manager} -y upgrade --quiet > /dev/null 2>&1

echo "Install ntp"
sudo ${package_manager} -y install bc python3-pip --quiet > /dev/null 2>&1

echo "Install the boto package"
pip3 install boto3 > /dev/null 2>&1

echo "apt update"
sudo ${package_manager} -y update --quiet > /dev/null 2>&1

# Role - Docker
echo "Checking and installing Docker along with it's dependencies"
sudo ${package_manager} -y --quiet install apt-transport-https ca-certificates curl software-properties-common virtualenv python3-setuptools > /dev/null 2>&1

if [[ $package_manager -eq apt-get ]];then
    echo "++++++++++++++++++++"
    echo "Setting up docker repos"
    sudo $package_manager update  --quiet > /dev/null 2>&1

    sudo apt-get  -y --quiet install apt-transport-https ca-certificates curl gnupg-agent software-properties-common > /dev/null 2>&1
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - > /dev/null 2>&1
    sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable" > /dev/null 2>&1
else
    sudo yum install -y yum-utils > /dev/null 2>&1
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo > /dev/null 2>&1
fi

sudo ${package_manager} -y update --quiet > /dev/null 2>&1
echo "++++++++++Installing docker+++++++++++"
sudo ${package_manager} -y install docker-ce docker-ce-cli containerd.io --quiet > /dev/null 2>&1

echo "++++++++++Installing Docker-compose++++++"
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose > /dev/null 2>&1
sudo chmod +x /usr/local/bin/docker-compose > /dev/null 2>&1

pip3 install docker > /dev/null 2>&1


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

${package_manager} install -y moreutils --quiet
public_ip=`ifdata -pa eth0`

echo $public_ip

echo "++++++++++++"
echo "Building custom template"
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