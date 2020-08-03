#!/bin/bash
set -o errexit

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
    sudo ${package_manager} -y install docker-ce docker-ce-cli containerd.io --quiet
   
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

check_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        package_manager="brew"
        desired_os=1
        return
    fi

    os_name=`cat /etc/*-release | egrep "^NAME="`
    os_name="${os_name#*=}"
    echo $os_name
    case "${os_name}" in
        \"Ubuntu*\")
            desired_os=1
            package_manager="apt-get"
            ;;
        \"Red\ Hat*\")
            desired_os=1
            package_manager="yum"
            ;;
        \"CentOS*\")
            desired_os=1
            package_manager="yum"
            ;;
        *)          desired_os=0
    esac
}

overwrite_file() {
    file_location=$1
    template_file=$2

    if [ -f $install_dir/$file_location ]
    then
        read -p "File $file_location already exists. Would you like to replace it? [Y]: " value
        value=${value:-Y}

        if [ $value == "Y" -o $value == "y" -o $value == "yes" -o $value == "Yes" ]
        then
            mv -f  $template_file $install_dir/$file_location
            echo "File $install_dir/$file_location replaced successfuly!"
        else
            echo "You chose not to replace existing file: $install_dir/$file_location"
	        rm -rf $template_file
	        echo "File $template_file removed from source directory."
            echo ""
        fi
    else
        mv -f $template_file $install_dir/$file_location
    fi
}

echo -e "\U1F44B  Thank you for trying out Appsmith! "
echo ""


# Checking OS and assiging package manager
desired_os=0
echo -e "\U1F575  Detecting your OS"
check_os
echo ""

if [[ $desired_os -eq 0 ]];then
    echo "This script is currently meant to install Appsmith on Mac OS X | Ubuntu | RHEL | CentOS machines."
    echo "Please contact support@appsmith.com with your OS details if you wish to extend this support"
    echo -e "Exiting for now. Bye! \U1F44B"
    exit
fi

read -p 'Installation Directory [appsmith]: ' install_dir
install_dir=${install_dir:-appsmith}
mkdir -p $PWD/$install_dir
install_dir=$PWD/$install_dir
read -p 'Is this a fresh installation? [Y/n]' fresh_install
fresh_install=${fresh_install:-Y}
echo ""

if [ $fresh_install == "N" -o $fresh_install == "n" -o $fresh_install == "no" -o $fresh_install == "No" ];then
    read -p 'Enter your current mongo db host: ' mongo_host
    read -p 'Enter your current mongo root user: ' mongo_root_user
    read -sp 'Enter your current mongo password: ' mongo_root_password
    read -p 'Enter your current mongo database name: ' mongo_database
    # It is possible that this isn't the first installation. 
    echo ""
    read -p 'Do you have any existing data in the database?[Y/n]: ' existing_encrypted_data
    existing_encrypted_data=${existing_encrypted_data:-Y}
    # In this case be more cautious of auto generating the encryption keys. Err on the side of not generating the encryption keys
    if [ $existing_encrypted_data == "N" -o $existing_encrypted_data == "n" -o $existing_encrypted_data == "no" -o $existing_encrypted_data == "No" ];then
        auto_generate_encryption="true"
    else
        auto_generate_encryption="false"
    fi
elif [ $fresh_install == "Y" -o $fresh_install == "y" -o $fresh_install == "yes" -o $fresh_install == "Yes" ];then
    echo "Appsmith needs to create a mongo db"
    mongo_host="mongo"
    mongo_database="appsmith"
    read -p 'Set the mongo root user: ' mongo_root_user
    read -sp 'Set the mongo password: ' mongo_root_password
    # Since the mongo was automatically setup, this must be the first time installation. Generate encryption credentials for this scenario
    auto_generate_encryption="true"
fi
echo ""

encryptionEnv=./template/encryption.env
if test -f "$encryptionEnv"; then
    echo "CAUTION : This isn't your first time installing appsmith. Encryption password and salt already exist. Do you want to override this? NOTE: Overwriting the existing salt and password would lead to you losing access to sensitive information encrypted using the same"
    echo "1) No. Conserve the older encryption password and salt and continue"
    echo "2) Yes. Overwrite the existing encryption (NOT SUGGESTED) with autogenerated encryption password and salt"
    echo "3) Yes. Overwrite the existing encryption (NOT SUGGESTED) with manually entering the encryption password and salt"
    read -p 'Enter option number [1]: ' overwrite_encryption
    overwrite_encryption=${overwrite_encryption:-1}
    auto_generate_encryption="false"
    if [[ $overwrite_encryption -eq 1 ]];then
        setup_encryption="false"
    elif [[ $overwrite_encryption -eq 2 ]];then
        setup_encryption="true"
        auto_generate_encryption="true" 
    elif [[ $overwrite_encryption -eq 3 ]];then
        setup_encryption="true"
        auto_generate_encryption="false"
    fi
else
    setup_encryption="true"
fi

if [[ "$setup_encryption" = "true" ]];then
    if [[ "$auto_generate_encryption" = "false" ]];then
        echo "Please enter the salt and password found in the encyption.env file of your previous appsmith installation "
        read -p 'Enter your encryption password: ' user_encryption_password
        read -p 'Enter your encryption salt: ' user_encryption_salt 
    elif [[ "$auto_generate_encryption" = "true" ]];then
   # Picked up the following method of generation from : https://gist.github.com/earthgecko/3089509
        user_encryption_password=$(cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 13 | head -n 1)
        user_encryption_salt=$(cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 13 | head -n 1)
    fi
fi

echo ""
read -p 'Are you installing appsmith on a cloud instance? [N/y]: ' cloud_install
cloud_install=${cloud_install:-N}
setup_ssl="n"
if [ $cloud_install == "Y" -o $cloud_install == "y" -o $cloud_install == "yes" -o $cloud_install == "Yes" ];then
    read -p 'Would you like to host appsmith on a custom domain / subdomain? [Y/n]: ' setup_domain
    setup_domain=${setup_domain:-Y}
    if [ $setup_domain == "Y" -o $setup_domain == "y" -o $setup_domain == "yes" -o $setup_domain == "Yes" ];then
        echo ""
        echo "+++++++++++ IMPORTANT PLEASE READ ++++++++++++++++++++++"
        echo "Please update your DNS records with your domain registrar"
        echo "You can read more about this in our Documentation"
        echo "https://docs.appsmith.com/v/v1.1/quick-start#custom-domains"
        echo "+++++++++++++++++++++++++++++++++++++++++++++++"
        echo ""
        echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
        read -p '(Your DNS records must be updated for us to provision SSL) [Y/n]: ' setup_ssl
        setup_ssl=${setup_ssl:-Y}
    fi
fi

if [ $setup_ssl == "Y" -o $setup_ssl == "y" -o $setup_ssl == "yes" -o $setup_ssl == "Yes" ];then
	read -p 'Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com): ' custom_domain
fi

NGINX_SSL_CMNT=""
if [[ -z $custom_domain ]]; then
    NGINX_SSL_CMNT="#"
fi

mkdir -p template
( cd template
curl -O --silent https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker-compose.yml.sh
curl -O --silent https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/init-letsencrypt.sh.sh
curl -O --silent https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/mongo-init.js.sh
curl -O --silent https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker.env.sh
curl -O --silent https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/nginx_app.conf.sh
curl -O --silent https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/encryption.env.sh
)

# Role - Docker
if ! is_command_present docker ;then
    if [ $package_manager == "apt-get" -o $package_manager == "yum" ];then
        install_docker
    else
        echo ""
        echo "+++++++++++ IMPORTANT READ ++++++++++++++++++++++"
        echo "Docker Desktop must be installed manually on Mac OS to proceed. Docker will be installed automatically on Ubuntu / Redhat / Cent OS"
        echo "https://docs.docker.com/docker-for-mac/install/"
        echo "++++++++++++++++++++++++++++++++++++++++++++++++"
        exit
    fi
fi

# Starting docker service
if [ $package_manager == "yum" -o $package_manager == "apt-get" ];then
    start_docker
fi

# Role - Folder
for directory_name in nginx certbot mongo/db opa/config
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
if [[ "$setup_encryption" = "true" ]];then
   . ./template/encryption.env.sh
fi
chmod 0755 init-letsencrypt.sh

overwrite_file "/data/nginx/app.conf.template" "nginx_app.conf"
overwrite_file "/docker-compose.yml" "docker-compose.yml"
overwrite_file "/data/mongo/init.js" "mongo-init.js"
overwrite_file "/init-letsencrypt.sh" "init-letsencrypt.sh"
overwrite_file "/docker.env" "docker.env"
overwrite_file "/encryption.env" "encryption.env"

echo ""

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
echo "Your application is running on http://localhost"
echo "Need help troubleshooting?"
echo "Join our discord server https://discord.com/invite/rBTTVJp"
