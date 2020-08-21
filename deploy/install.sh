#!/bin/bash

set -o errexit

is_command_present() {
  type "$1" >/dev/null 2>&1
}

# This function checks if the relevant ports required by Appsmith are available or not
# The script should error out in case they aren't available
check_ports_occupied() {
    ports_occupied="$(
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sudo netstat -anp tcp
        else
            sudo netstat -tupln tcp
        fi | awk '$6 == "LISTEN" && $4 ~ /^.*[.:](80|443)$/' | wc -l | grep -o '[[:digit:]]\+'
    )"
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
}

install_docker_compose() {
    if [ $package_manager == "apt-get" -o $package_manager == "yum" ];then
        if [ ! -f /usr/bin/docker-compose ];then
            echo "Installing docker-compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
            echo "docker-compose installed!"
            echo ""
        fi
    else
        echo "+++++++++++ IMPORTANT READ ++++++++++++++++++++++"
        echo "docker-compose not found! Please install docker-compose first and then continue with this installation."
        echo "Refer https://docs.docker.com/compose/install/ for installing docker-compose."
        echo "+++++++++++++++++++++++++++++++++++++++++++++++++"
        bye
    fi
}

start_docker() {
    if ! sudo systemctl is-active docker.service > /dev/null; then
        echo "Starting docker service"
        sudo systemctl start docker.service
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
    local relative_path="$1"
    local template_file="$2"
    local full_path="$install_dir/$relative_path"

    if [[ -f $full_path ]]; then
        read -p "File $relative_path already exists. Would you like to replace it? [Y]: " value
        value=${value:-Y}

        if ! [[ $value == "Y" || $value == "y" || $value == "yes" || $value == "Yes" ]]; then
            echo "You chose not to replace existing file: '$full_path'."
            rm -f "$template_file"
            echo "File $template_file removed from source directory."
            echo ""
        fi
    else
        mv -f "$template_file" "$full_path"
        echo "File $full_path moved successfully!"
    fi
}

# This function prompts the user for an input for a non-empty Mongo root password. 
read_mongo_password() {
    read -sp 'Set the mongo password: ' mongo_root_password
    while [[ -z $mongo_root_password ]] 
    do
        echo ""
        echo ""
        echo "+++++++++++ ERROR ++++++++++++++++++++++"
        echo "The mongo password cannot be empty. Please input a valid password string."
        echo "++++++++++++++++++++++++++++++++++++++++"
        echo ""
        read -sp 'Set the mongo password: ' mongo_root_password
    done 
}

# This function prompts the user for an input for a non-empty Mongo username. 
read_mongo_username() {
    read -p 'Set the mongo root user: ' mongo_root_user
    while [[ -z $mongo_root_user ]] 
    do
        echo ""
        echo "+++++++++++ ERROR ++++++++++++++++++++++"
        echo "The mongo username cannot be empty. Please input a valid username string."
        echo "++++++++++++++++++++++++++++++++++++++++"
        echo ""
        read -p 'Set the mongo root user: ' mongo_root_user
    done
}

wait_for_containers_start() {
    local timeout=$1

    # The while loop is important because for-loops don't work for dynamic values
    while [[ $timeout -gt 0 ]]; do
        status_code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1 || true)"
        if [[ status_code -eq 401 ]]; then
            break
        else
            echo -ne "Waiting for all containers to start. This check will timeout in $timeout seconds...\r\c"
        fi
        ((timeout--))
        sleep 1
    done

    echo ""
}

urlencode() {
    # urlencode <string>
    old_lc_collate=$LC_COLLATE
    LC_COLLATE=C

    local length="${#1}"
    for (( i = 0; i < length; i++ )); do
        local c="${1:i:1}"
        case $c in
            [a-zA-Z0-9.~_-]) printf "$c" ;;
            *) printf '%%%02X' "'$c" ;;
        esac
    done

    LC_COLLATE=$old_lc_collate
}

bye() {  # Prints a friendly good bye message and exits the script.
    echo ""
    echo -e "Exiting for now. Bye! \U1F44B"
    exit
}

echo -e "\U1F44B  Thank you for trying out Appsmith! "
echo ""


# Checking OS and assigning package manager
desired_os=0
echo -e "\U1F575  Detecting your OS"
check_os

if [[ $desired_os -eq 0 ]];then
    echo ""
    echo "This script is currently meant to install Appsmith on Mac OS X | Ubuntu | RHEL | CentOS machines."
    echo "Please contact support@appsmith.com with your OS details if you wish to extend this support"
    bye
else
    echo "You're on an OS that is supported by this installation script."
    echo ""
fi

if [[ "$OSTYPE" == "darwin"* && "$EUID" -eq 0 ]]; then
    echo "Please do not run this script with root permissions on macOS."
    echo "Please contact support@appsmith.com with your OS details if you wish to extend this support"
    bye
fi

check_ports_occupied

if [[ $ports_occupied -ne 0 ]]; then
    echo "+++++++++++ ERROR ++++++++++++++++++++++"
    echo "Appsmith requires ports 80 & 443 to be open. Please shut down any other service(s) that may be running on these ports."
    echo "++++++++++++++++++++++++++++++++++++++++"
    echo ""
    bye
fi

# Check is Docker daemon is installed and available. If not, the install & start Docker for Linux machines. We cannot automatically install Docker Desktop on Mac OS
if ! is_command_present docker ;then
    if [ $package_manager == "apt-get" -o $package_manager == "yum" ];then
        install_docker
    else
        echo ""
        echo "+++++++++++ IMPORTANT READ ++++++++++++++++++++++"
        echo "Docker Desktop must be installed manually on Mac OS to proceed. Docker can only be installed automatically on Ubuntu / Redhat / Cent OS"
        echo "https://docs.docker.com/docker-for-mac/install/"
        echo "++++++++++++++++++++++++++++++++++++++++++++++++"
        exit
    fi
fi

# Install docker-compose
if ! is_command_present docker-compose; then
    install_docker_compose
fi

# Starting docker service
if [[ $package_manager == "yum" || $package_manager == "apt-get" ]]; then
    start_docker
fi

read -p 'Installation Directory [appsmith]: ' install_dir
install_dir="${install_dir:-appsmith}"
mkdir -p "$PWD/$install_dir"
install_dir="$PWD/$install_dir"
read -p 'Is this a fresh installation? [Y/n]' fresh_install
fresh_install="${fresh_install:-Y}"
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
    
    # We invoke functions to read the mongo credentials from the user because they MUST be non-empty
    read_mongo_username
    read_mongo_password

    # Since the mongo was automatically setup, this must be the first time installation. Generate encryption credentials for this scenario
    auto_generate_encryption="true"
fi
echo ""

# urlencoding the Mongo username and password
encoded_mongo_root_user=$( urlencode $mongo_root_user )
encoded_mongo_root_password=$( urlencode $mongo_root_password )

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
read -p 'Do you have a custom domain that you would like to link? (Only for cloud installations) [N/y]: ' setup_domain
setup_domain=${setup_domain:-N}
# Setting default value for the setup_ssl variable. Without this, the script errors out in the if condition later
setup_ssl='N'

if [ $setup_domain == "Y" -o $setup_domain == "y" -o $setup_domain == "yes" -o $setup_domain == "Yes" ];then
    echo ""
    echo "+++++++++++ IMPORTANT PLEASE READ ++++++++++++++++++++++"
    echo "Please update your DNS records with your domain registrar"
    echo "You can read more about this in our Documentation"
    echo "https://docs.appsmith.com/v/v1.1/quick-start#custom-domains"
    echo "+++++++++++++++++++++++++++++++++++++++++++++++"
    echo ""
    echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
    read -p '(Your DNS records must be updated for us to proceed) [Y/n]: ' setup_ssl
    setup_ssl=${setup_ssl:-Y}
fi

if [ $setup_ssl == "Y" -o $setup_ssl == "y" -o $setup_ssl == "yes" -o $setup_ssl == "Yes" ]; then
	read -p 'Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com): ' custom_domain
fi

NGINX_SSL_CMNT=""
if [[ -z $custom_domain ]]; then
    NGINX_SSL_CMNT="#"
fi

echo ""
echo "Downloading the configuration templates..."
mkdir -p template
( cd template
curl --remote-name-all --silent --show-error \
    https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker-compose.yml.sh \
    https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/init-letsencrypt.sh.sh \
    https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/mongo-init.js.sh \
    https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/docker.env.sh \
    https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/nginx_app.conf.sh \
    https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/template/encryption.env.sh
)

# Role - Folder
for directory_name in nginx certbot/conf certbot/www mongo/db
do
    mkdir -p "$install_dir/data/$directory_name"
done

echo ""
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

overwrite_file "data/nginx/app.conf.template" "nginx_app.conf"
overwrite_file "docker-compose.yml" "docker-compose.yml"
overwrite_file "data/mongo/init.js" "mongo-init.js"
overwrite_file "init-letsencrypt.sh" "init-letsencrypt.sh"
overwrite_file "docker.env" "docker.env"
overwrite_file "encryption.env" "encryption.env"

echo ""

cd "$install_dir"
if [[ -n $custom_domain ]]; then
    echo "Running init-letsencrypt.sh..."
    sudo ./init-letsencrypt.sh
else
    echo "No domain found. Skipping generation of SSL certificate."
fi

echo ""
echo "Pulling the latest container images"
sudo docker-compose pull
echo ""
echo "Starting the Appsmith containers"
# The docker-compose command does some nasty stuff for the `--detach` functionality. So we add a `|| true` so that the
# script doesn't exit because this command looks like it failed to do it's thing.
sudo docker-compose up --detach --remove-orphans || true

wait_for_containers_start 60
echo ""

if [[ $status_code -ne 401 ]]; then
    echo "+++++++++++ ERROR ++++++++++++++++++++++"
    echo "The containers didn't seem to start correctly. Please run the following command to check containers that may have errored out:"
    echo ""
    echo -e "cd \"$install_dir\" && sudo docker-compose ps -a"
    echo "For troubleshooting help, please reach out to us via our Discord server: https://discord.com/invite/rBTTVJp"
    echo "++++++++++++++++++++++++++++++++++++++++"
    echo ""
else
    echo "+++++++++++ SUCCESS ++++++++++++++++++++++++++++++"
    echo "Your installation is complete!"
    echo ""
    if [[ -z $custom_domain ]]; then
        echo "Your application is running on 'http://localhost'."
    else
        echo "Your application is running on 'https://$custom_domain'."
    fi
    echo ""
    echo "+++++++++++++++++++++++++++++++++++++++++++++++++"
    echo ""
    echo "Need help troubleshooting?"
    echo "Join our Discord server https://discord.com/invite/rBTTVJp"
fi

echo ""
echo -e "Peace out \U1F596\n"
