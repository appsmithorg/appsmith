#!/bin/bash

set -o errexit

is_command_present() {
    type "$1" >/dev/null 2>&1
}

is_mac() {
    [[ $OSTYPE == darwin* ]]
}
# This function checks if the relevant ports required by Appsmith are available or not
# The script should error out in case they aren't available

check_k8s_setup() {
    echo "Checking your k8s setup status"
    if ! is_command_present kubectl; then
        echo "Please install kubectl on your machine"
        exit 1
    else
        
        if ! is_command_present jq; then
            install_jq
        fi
        clusters=`kubectl config view -o json | jq -r '."current-context"'` 
        if [[ ! -n $clusters ]]; then
            echo "Please setup a k8s cluster & config kubectl to connect to it"
            exit 1
        fi
        k8s_major_version=`kubectl version --short -o json | jq ."serverVersion.major" | sed 's/[^0-9]*//g'`
        k8s_minor_version=`kubectl version --short -o json | jq ."serverVersion.minor" | sed 's/[^0-9]*//g'`
        if [[ $k8s_minor_version < 19 ]]; then
            echo "Script is only support Kubernetes >= v1.19"
            exit 1
        fi;
    fi
}

install_jq(){
    if [ $package_manager == "brew" ]; then
        brew install jq
    elif [ $package_manager == "yum" ]; then
        yum_cmd="sudo yum --assumeyes --quiet"
        $yum_cmd install jq
    else
        apt_cmd="sudo apt-get --yes --quiet"
        $apt_cmd update
        $apt_cmd install jq
    fi
}



check_os() {
    if is_mac; then
        package_manager="brew"
        desired_os=1
        os="Mac"
        return
    fi

    os_name="$(cat /etc/*-release | awk -F= '$1 == "NAME" { gsub(/"/, ""); print $2; exit }')"

    case "$os_name" in
        Ubuntu*)
            desired_os=1
            os="Ubuntu"
            package_manager="apt-get"
            ;;
        Red\ Hat*)
            desired_os=1
            os="Red Hat"
            package_manager="yum"
            ;;
        CentOS*)
            desired_os=1
            os="CentOS"
            package_manager="yum"
            ;;
        *)
            desired_os=0
            os="Not Found"
    esac
}

overwrite_file() {
    local relative_path="$1"
    local template_file="$2"
    local full_path="$install_dir/$relative_path"
    echo "Copy $template_file to $full_path"

    if [[ -f $full_path ]] && ! confirm y "File $relative_path already exists. Would you like to replace it?"; then
        rm -f "$template_file"
    else 
        mv -f "$template_file" "$full_path"
    fi
}

# This function prompts the user for an input for a non-empty Mongo root password. 
read_mongo_password() {
    read -srp 'Set the mongo password: ' mongo_root_password
    while [[ -z $mongo_root_password ]]; do
        echo ""
        echo ""
        echo "+++++++++++ ERROR ++++++++++++++++++++++"
        echo "The mongo password cannot be empty. Please input a valid password string."
        echo "++++++++++++++++++++++++++++++++++++++++"
        echo ""
        read -srp 'Set the mongo password: ' mongo_root_password
    done 
}

# This function prompts the user for an input for a non-empty Mongo username. 
read_mongo_username() {
    read -rp 'Set the mongo root user: ' mongo_root_user
    while [[ -z $mongo_root_user ]]; do
        echo ""
        echo "+++++++++++ ERROR ++++++++++++++++++++++"
        echo "The mongo username cannot be empty. Please input a valid username string."
        echo "++++++++++++++++++++++++++++++++++++++++"
        echo ""
        read -rp 'Set the mongo root user: ' mongo_root_user
    done
}

urlencode() {
    # urlencode <string>
    local old_lc_collate="$LC_COLLATE"
    LC_COLLATE=C

    local length="${#1}"
    for (( i = 0; i < length; i++ )); do
        local c="${1:i:1}"
        case $c in
            [a-zA-Z0-9.~_-]) printf "$c" ;;
            *) printf '%%%02X' "'$c" ;;
        esac
    done

    LC_COLLATE="$old_lc_collate"
}

generate_password() {
    # Picked up the following method of generation from : https://gist.github.com/earthgecko/3089509
    LC_CTYPE=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 13 | head -n 1
}

confirm() {
    local default="$1"  # Should be `y` or `n`.
    local prompt="$2"

    local options="y/N"
    if [[ $default == y || $default == Y ]]; then
        options="Y/n"
    fi

    local answer
    read -rp "$prompt [$options] " answer
    if [[ -z $answer ]]; then
        # No answer given, the user just hit the Enter key. Take the default value as the answer.
        answer="$default"
    else
        # An answer was given. This means the user didn't get to hit Enter so the cursor on the same line. Do an empty
        # echo so the cursor moves to a new line.
        echo
    fi

    [[ yY =~ $answer ]]
}


echo_contact_support() {
    echo "Please contact <support@appsmith.com> with your OS details and version${1:-.}"
}

bye() {  # Prints a friendly good bye message and exits the script.
    set +o errexit
    echo "Please share your email to receive support with the installation"
    read -rp 'Email: ' email
    curl -s -O --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Support",
      "data": {
          "os": "'"$os"'",
          "email": "'"$email"'"
       }
    }'
    echo -e "\nExiting for now. Bye! \U1F44B\n"
    exit 1
}
download_template_file() {
    templates_dir="$(mktemp -d)"
    template_endpoint="https://raw.githubusercontent.com/appsmithorg/appsmith/feature/k8s-deployment"
    mkdir -p "$templates_dir"
    (
        cd "$templates_dir"
        curl --remote-name-all --silent --show-error -o appsmith-configmap.yaml.sh \
            "$template_endpoint/deploy/k8s/scripts/appsmith-configmap.yaml.sh"
        curl --remote-name-all --silent --show-error -o appsmith-ingress.yaml.sh \
            "$template_endpoint/deploy/k8s/scripts/appsmith-ingress.yaml.sh"
        curl --remote-name-all --silent --show-error -o encryption-configmap.yaml.sh \
            "$template_endpoint/deploy/k8s/scripts/encryption-configmap.yaml.sh"
        curl  --remote-name-all --silent --show-error -o mongo-configmap.yaml.sh \
            "$template_endpoint/deploy/k8s/scripts/mongo-configmap.yaml.sh"
        curl  --remote-name-all --silent --show-error -o nginx-configmap.yaml \
            "$template_endpoint/deploy/k8s/scripts/nginx-configmap.yaml"
    )
    (
        cd "$install_dir"
        curl --remote-name-all --silent --show-error  -o backend-template.yaml \
            "$template_endpoint/deploy/k8s/templates/backend-template.yaml"
        
        curl --remote-name-all --silent --show-error  -o frontend-template.yaml \
            "$template_endpoint/deploy/k8s/templates/frontend-template.yaml"
        if [[ "$fresh_installation" == "true" ]]; then
            curl --remote-name-all --silent --show-error  -o mongo-template.yaml \
                "$template_endpoint/deploy/k8s/templates/mongo-template.yaml"
        fi

        curl --remote-name-all --silent --show-error  -o redis-template.yaml \
            "$template_endpoint/deploy/k8s/templates/redis-template.yaml"
        curl --remote-name-all --silent --show-error  -o imago-template.yaml\
            "$template_endpoint/deploy/k8s/templates/imago-template.yaml"
    )
}


deploy_app() {
    kubectl apply -f "$install_dir/config-template"
    kubectl apply -f "$install_dir"
}

install_certmanager() {
    cert_manager_ns=`kubectl get namespace cert-manager --no-headers --output=go-template={{.metadata.name}} 2>/dev/null`
    if [ -z "${cert_manager_ns}" ]; then
        echo ""
        echo "Installing Cert-manager"
        kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.0.3/cert-manager.yaml
    else 
        echo " "
        echo "Cert-manager already install"
    fi
}

wait_for_application_start() {
    local timeout=$1
    address=$custom_domain
    # The while loop is important because for-loops don't work for dynamic values
    while [[ $timeout -gt 0 ]]; do
        if [[ $address == "" || $address == null ]]; then
            address=`kubectl get ingress appsmith-ingress -o json | jq -r '.status.loadBalancer.ingress[0].ip'`
        fi
        status_code="$(curl -s -o /dev/null -w "%{http_code}" http://$address/api/v1 || true)"
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

echo -e "\U1F44B  Thank you for trying out Appsmith! "
echo ""


# Checking OS and assigning package manager
desired_os=0
os=""
echo -e "\U1F575  Detecting your OS"
check_os
APPSMITH_INSTALLATION_ID=$(curl -s 'https://api64.ipify.org')

# Run bye if failure happens
trap bye EXIT

curl -s -O --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
--header 'Content-Type: text/plain' \
--data-raw '{
  "userId": "'"$APPSMITH_INSTALLATION_ID"'",
  "event": "Installation Started",
  "data": {
      "os": "'"$os"'"
   }
}'

if [[ $desired_os -eq 0 ]];then
    echo ""
    echo "This script is currently meant to install Appsmith on Mac OS X | Ubuntu machines."
    echo_contact_support " if you wish to extend this support."
    bye
else
    echo "You're on an OS that is supported by this installation script."
    echo ""
fi

if [[ $EUID -eq 0 ]]; then
    echo "Please do not run this script as root/sudo."
    echo_contact_support
    bye
fi

# Check for  kubernetes setup
check_k8s_setup

read -rp 'Installation Directory [appsmith]: ' install_dir
install_dir="${install_dir:-appsmith}"
if [[ $install_dir != /* ]]; then
    # If it's not an absolute path, prepend current working directory to it, to make it an absolute path.
    install_dir="$PWD/$install_dir"
fi
echo "Installing Appsmith to '$install_dir'."
mkdir -p "$install_dir"
echo ""


if confirm y "Is this a fresh installation?"; then
    fresh_installation="true"
    echo "Appsmith needs to create a MongoDB instance."
    mongo_protocol="mongodb://"
    mongo_host="mongo-service"
    mongo_database="appsmith"

    # We invoke functions to read the mongo credentials from the user because they MUST be non-empty
    read_mongo_username
    read_mongo_password

    # Since the mongo was automatically setup, this must be the first time installation. Generate encryption credentials for this scenario
    auto_generate_encryption="true"
else
    fresh_installation="false"
    read -rp 'Enter your current mongo db protocol (mongodb:// || mongodb+srv://): ' mongo_protocol
    read -rp 'Enter your current mongo db host: ' mongo_host
    read -rp 'Enter your current mongo root user: ' mongo_root_user
    read -srp 'Enter your current mongo password: ' mongo_root_password
    echo ""
    read -rp 'Enter your current mongo database name: ' mongo_database
    # It is possible that this isn't the first installation.
    echo ""
    # In this case be more cautious of auto generating the encryption keys. Err on the side of not generating the encryption keys
    if confirm y "Do you have any existing data in the database?"; then
        auto_generate_encryption="false"
    else
        auto_generate_encryption="true"
    fi
fi
echo ""

# urlencoding the Mongo username and password
encoded_mongo_root_user=$(urlencode "$mongo_root_user")
encoded_mongo_root_password=$(urlencode "$mongo_root_password")

encryptionEnv="$install_dir/config-template/encryption-configmap.yaml"
if test -f "$encryptionEnv"; then
    echo "CAUTION : This isn't your first time installing appsmith. Encryption password and salt already exist. Do you want to override this? NOTE: Overwriting the existing salt and password would lead to you losing access to sensitive information encrypted using the same"
    echo "1) No. Conserve the older encryption password and salt and continue"
    echo "2) Yes. Overwrite the existing encryption (NOT SUGGESTED) with autogenerated encryption password and salt"
    echo "3) Yes. Overwrite the existing encryption (NOT SUGGESTED) with manually entering the encryption password and salt"
    read -rp 'Enter option number [1]: ' overwrite_encryption
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
        read -rp 'Enter your encryption password: ' user_encryption_password
        read -rp 'Enter your encryption salt: ' user_encryption_salt
    elif [[ "$auto_generate_encryption" = "true" ]]; then
        user_encryption_password=$(generate_password)
        user_encryption_salt=$(generate_password)
    fi
fi

echo ""

if confirm n "Do you have a custom domain that you would like to link? (Only for cloud installations)"; then
    read -rp 'Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com): ' custom_domain
    curl -s -O --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Custom Domain",
      "data": {
          "os": "'"$os"'"
       }
    }'
    echo ""
    echo "+++++++++++ IMPORTANT PLEASE READ ++++++++++++++++++++++"
    echo "Please update your DNS records with your domain registrar"
    echo "You can read more about this in our Documentation"
    echo "https://docs.appsmith.com/v/v1.1/quick-start#custom-domains"
    echo "+++++++++++++++++++++++++++++++++++++++++++++++"
    echo ""
    # echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
    # if confirm y '(Your DNS records must be updated for us to proceed)'; then
    #     ssl_enable="true"
    # fi
fi

echo ""
echo "Downloading the configuration templates..."
download_template_file

echo ""
echo "Generating the configuration files from the templates"

cd "$templates_dir" 

bash "$templates_dir/appsmith-configmap.yaml.sh" "$mongo_protocol" "$mongo_host" "$encoded_mongo_root_user" "$encoded_mongo_root_password" "$mongo_database" > appsmith-configmap.yaml
if [[ "$setup_encryption" == "true" ]]; then
    bash "$templates_dir/encryption-configmap.yaml.sh" "$user_encryption_password" "$user_encryption_salt" > encryption-configmap.yaml
fi

if [[ -n $custom_domain ]]; then
    bash "$templates_dir/appsmith-ingress.yaml.sh" "$custom_domain" > ingress-template.yaml
else
    bash "$templates_dir/appsmith-ingress.yaml.sh" "" > ingress-template.yaml
fi

mkdir -p "$install_dir/config-template"
overwrite_file "config-template" "nginx-configmap.yaml"
overwrite_file "config-template" "appsmith-configmap.yaml"
if [[ "$setup_encryption" = "true" ]];then
    overwrite_file "config-template" "encryption-configmap.yaml"
fi
overwrite_file "" "ingress-template.yaml"

if [[ "$fresh_installation" == "true" ]]; then
    bash "$templates_dir/mongo-configmap.yaml.sh" "$mongo_root_user" "$mongo_root_password" "$mongo_database" > mongo-configmap.yaml
    overwrite_file "config-template" "mongo-configmap.yaml"
fi



echo ""
echo "Deploy Appmisth on your cluster"
deploy_app

# echo ""
# if [[ -n $custom_domain ]]; then
#     install_certmanager
# else
#     echo "No domain found. Skipping generation of SSL certificate."
# fi
# echo ""
wait_for_application_start 60

echo ""
if [[ $status_code -ne 401 ]]; then
    echo "+++++++++++ ERROR ++++++++++++++++++++++"
    echo "The containers didn't seem to start correctly. Please run the following command to check pods that may have errored out:"
    echo ""
    echo -e "kubectl get pods"
    echo "For troubleshooting help, please reach out to us via our Discord server: https://discord.com/invite/rBTTVJp"
    echo "++++++++++++++++++++++++++++++++++++++++"
    echo ""
    echo "Please share your email to receive help with the installation"
    read -rp 'Email: ' email
    curl -s -O --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Support",
      "data": {
          "os": "'"$os"'",
          "email": "'"$email"'"
       }
    }'
else
    curl -s -O --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Success",
      "data": {
          "os": "'"$os"'"
       }
    }'
    echo "+++++++++++ SUCCESS ++++++++++++++++++++++++++++++"
    echo "Your installation is complete!"
    echo ""
    if [[ -z $custom_domain ]]; then
        echo "Your application is running on 'http://$address'."
    else
        echo "Your application is running on 'http://$custom_domain'."
    fi
    echo ""
    echo "+++++++++++++++++++++++++++++++++++++++++++++++++"
    echo ""
    echo "Need help Getting Started?"
    echo "Join our Discord server https://discord.com/invite/rBTTVJp"
    echo "Please share your email to receive support & updates about appsmith!"
    read -rp 'Email: ' email
    curl -s -O --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Identify Successful Installation",
      "data": {
          "os": "'"$os"'",
          "email": "'"$email"'"
       }
    }'
fi

echo -e "\nPeace out \U1F596\n"