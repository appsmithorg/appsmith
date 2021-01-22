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
check_ports_occupied() {
    local port_check_output
    local ports_pattern="80|443"

    if is_mac; then
        port_check_output="$(netstat -anp tcp | awk '$6 == "LISTEN" && $4 ~ /^.*\.('"$ports_pattern"')$/')"
    elif is_command_present ss; then
        # The `ss` command seems to be a better/faster version of `netstat`, but is not available on all Linux
        # distributions by default. Other distributions have `ss` but no `netstat`. So, we try for `ss` first, then
        # fallback to `netstat`.
        port_check_output="$(ss --all --numeric --tcp | awk '$1 == "LISTEN" && $4 ~ /^.*:('"$ports_pattern"')$/')"
    elif is_command_present netstat; then
        port_check_output="$(netstat --all --numeric --tcp | awk '$6 == "LISTEN" && $4 ~ /^.*:('"$ports_pattern"')$/')"
    fi

    if [[ -n $port_check_output ]]; then
        curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
        --header 'Content-Type: text/plain' \
        --data-raw '{
            "userId": "'"$APPSMITH_INSTALLATION_ID"'",
            "event": "Installation Error",
            "data": {
                "os": "'"$os"'",
                "error": "port taken"
            }
        }' > /dev/null
        echo "+++++++++++ ERROR ++++++++++++++++++++++"
        echo "Appsmith requires ports 80 & 443 to be open. Please shut down any other service(s) that may be running on these ports."
        echo "++++++++++++++++++++++++++++++++++++++++"
        echo ""
        exit 1
    fi
}

install_docker() {
    echo "++++++++++++++++++++++++"
    echo "Setting up docker repos"

    if [[ $package_manager == apt-get ]]; then
        apt_cmd="sudo apt-get --yes --quiet"
        $apt_cmd update
        $apt_cmd install software-properties-common gnupg-agent
        curl -fsSL "https://download.docker.com/linux/$os/gpg" | sudo apt-key add -
        sudo add-apt-repository \
            "deb [arch=amd64] https://download.docker.com/linux/$os $(lsb_release -cs) stable"
        $apt_cmd update
        echo "Installing docker"
        $apt_cmd install docker-ce docker-ce-cli containerd.io
    elif [[ $package_manager == zypper ]]; then
        zypper_cmd="sudo zypper --quiet --no-gpg-checks --non-interactive"
        echo "Installing docker"
        if [[ $os == sles ]]; then
            os_sp="$(cat /etc/*-release | awk -F= '$1 == "VERSION_ID" { gsub(/"/, ""); print $2; exit }')"
            os_arch="$(uname -i)"
            sudo SUSEConnect -p sle-module-containers/$os_sp/$os_arch -r ''
        fi
        $zypper_cmd install docker docker-runc containerd
        sudo systemctl enable docker.service
    else
        yum_cmd="sudo yum --assumeyes --quiet"
        $yum_cmd install yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/$os/docker-ce.repo
        echo "Installing docker"
        $yum_cmd install docker-ce docker-ce-cli containerd.io

    fi

}

install_docker_compose() {
    if [[ $package_manager == "apt-get" || $package_manager == "zypper" || $package_manager == "yum" ]]; then
        if [[ ! -f /usr/bin/docker-compose ]];then
            echo "++++++++++++++++++++++++"
            echo "Installing docker-compose"
            sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
            echo "docker-compose installed!"
            echo ""
        fi
    else
        curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
        --header 'Content-Type: text/plain' \
        --data-raw '{
            "userId": "'"$APPSMITH_INSTALLATION_ID"'",
            "event": "Installation Error",
            "data": {
                "os": "'"$os"'",
                "error": "Docker Compose Not Found"
            }
        }' > /dev/null
        echo "+++++++++++ IMPORTANT READ ++++++++++++++++++++++"
        echo "docker-compose not found! Please install docker-compose first and then continue with this installation."
        echo "Refer https://docs.docker.com/compose/install/ for installing docker-compose."
        echo "+++++++++++++++++++++++++++++++++++++++++++++++++"
        exit 1
    fi
}

start_docker() {
    if ! sudo systemctl is-active docker.service > /dev/null; then
        echo "Starting docker service"
        sudo systemctl start docker.service
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
            os="ubuntu"
            package_manager="apt-get"
            ;;
        Debian*)
            desired_os=1
            os="debian"
            package_manager="apt-get"
            ;;
        Red\ Hat*)
            desired_os=1
            os="red hat"
            package_manager="yum"
            ;;
        CentOS*)
            desired_os=1
            os="centos"
            package_manager="yum"
            ;;
        SLES*)
            desired_os=1
            os="sles"
            package_manager="zypper"
            ;;
        openSUSE*)
            desired_os=1
            os="opensuse"
            package_manager="zypper"
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

    if [[ -f $full_path ]] && ! confirm y "File $relative_path already exists. Would you like to replace it?"; then
        echo "You chose NOT to replace existing file: '$full_path'."
        rm -f "$template_file"
        echo "File $template_file removed from source directory."
        echo ""
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

init_ssl_cert() {
    local domain="$1"
    echo "Creating certificate for '$domain'."

    local rsa_key_size=4096
    local data_path="./data/certbot"

    if [[ -d "$data_path" ]]; then
        if ! confirm n "Existing certificate data found at '$data_path'. Continue and replace existing certificate?"; then
            return
        fi
    fi

    mkdir -p "$data_path"/{conf,www}

    if ! [[ -e "$data_path/conf/options-ssl-nginx.conf" && -e "$data_path/conf/ssl-dhparams.pem" ]]; then
        echo "### Downloading recommended TLS parameters..."
        curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
        curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
        echo
    fi

    echo "### Requesting Let's Encrypt certificate for '$domain'..."

    local email
    read -rp 'Enter email address to create SSL certificate: (Optional, but strongly recommended): ' email
    if [[ -z $email ]]; then
        local email_arg="--register-unsafely-without-email"
    else
        local email_arg="--email $email --no-eff-email"
    fi

    if confirm n 'Do you want to create certificate in staging mode (which is used for dev purposes and is not subject to rate limits)?'; then
        local staging_arg="--staging"
    else
        local staging_arg=""
    fi

    echo "### Generating OpenSSL key for '$domain'..."
    local live_path="/etc/letsencrypt/live/$domain"
    certbot_cmd \
        "sh -c \"mkdir -p '$live_path' && openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
            -keyout '$live_path/privkey.pem' \
            -out '$live_path/fullchain.pem' \
            -subj '/CN=localhost' \
            \""
    echo

    echo "### Starting nginx..."
    sudo docker-compose up --force-recreate --detach nginx
    echo

    echo "### Removing key now that validation is done for $domain..."
    certbot_cmd \
        "rm -Rfv /etc/letsencrypt/live/$domain /etc/letsencrypt/archive/$domain /etc/letsencrypt/renewal/$domain.conf"
    echo

    # The following command exits with a non-zero status code even if the certificate was generated, but some checks failed.
    # So we explicitly ignore such failure with a `|| true` in the end, to avoid bash quitting on us because this looks like
    # a failed command.
    certbot_cmd "certbot certonly --webroot --webroot-path=/var/www/certbot \
            $staging_arg \
            $email_arg \
            --domains $domain \
            --rsa-key-size $rsa_key_size \
            --agree-tos \
            --force-renewal" \
        || true
    echo

    echo "### Reloading nginx..."
    sudo docker-compose exec nginx nginx -s reload
}

certbot_cmd() {
    sudo docker-compose run --rm --entrypoint "$1" certbot
}

echo_contact_support() {
    echo "Please contact <support@appsmith.com> with your OS details and version${1:-.}"
}

bye() {  # Prints a friendly good bye message and exits the script.
    if [ "$?" -ne 0 ]; then
        set +o errexit
        echo "Please share your email if you wish to receive support with the installation"
        read -rp 'Email: ' email

        curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
        --header 'Content-Type: text/plain' \
        --data-raw '{
            "userId": "'"$APPSMITH_INSTALLATION_ID"'",
            "event": "Installation Support",
            "data": {
                "os": "'"$os"'",
                "email": "'"$email"'"
            }
        }' > /dev/null
        echo ""
        echo -e "\nWe will reach out to you at the email provided shortly, Exiting for now. Bye! 👋 \n"
        exit 0
    fi
}

ask_telemetry() {
    echo ""
    echo "+++++++++++ IMPORTANT ++++++++++++++++++++++"
    echo -e "Thank you for installing appsmith! We want to be transparent and request that you share anonymous usage data with us."
    echo -e "This data is purely statistical in nature and helps us understand your needs & provide better support to your self-hosted instance."
    echo -e "You can read more about what information is collected in our documentation https://docs.appsmith.com/telemetry/telemetry"
    echo -e ""
    if confirm y 'Would you like to share anonymous usage data and receive better support?'; then
        disable_telemetry="false"
    else
        disable_telemetry="true"
        echo "Please note that even though telemetry is disabled, your Appsmith server will connect to cloud to fetch release notes and to check for updates."
    fi
    echo "++++++++++++++++++++++++++++++++++++++++++++"

    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "userId": "'"$APPSMITH_INSTALLATION_ID"'",
        "event": "Installation Telemetry",
        "data": {
            "disable-telemetry": "'"$disable_telemetry"'"
        }
    }' > /dev/null
}

echo -e "👋 Thank you for trying out Appsmith! "
echo ""


# Checking OS and assigning package manager
desired_os=0
os=""
echo -e "🕵️  Detecting your OS"
check_os

APPSMITH_INSTALLATION_ID=$(curl -s 'https://api64.ipify.org')

# Run bye if failure happens
trap bye EXIT

curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
--header 'Content-Type: text/plain' \
--data-raw '{
  "userId": "'"$APPSMITH_INSTALLATION_ID"'",
  "event": "Installation Started",
  "data": {
      "os": "'"$os"'"
   }
}' > /dev/null

if [[ $desired_os -eq 0 ]];then
    echo ""
    echo "This script is currently meant to install Appsmith on Mac OS X, Ubuntu, SLES or openSUSE machines."
    echo_contact_support " if you wish to extend this support."
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "userId": "'"$APPSMITH_INSTALLATION_ID"'",
        "event": "Installation Error",
        "data": {
            "os": "'"$os"'",
            "error": "OS Not Supported"
        }
    }' > /dev/null
    exit 1
else
    echo "🙌 You're on an OS that is supported by this installation script."
    echo ""
fi

if [[ $EUID -eq 0 ]]; then
    echo "+++++++++++ ERROR ++++++++++++++++++++++"
    echo "Please do not run this script as root/sudo."
    echo "++++++++++++++++++++++++++++++++++++++++"
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "userId": "'"$APPSMITH_INSTALLATION_ID"'",
        "event": "Installation Error",
        "data": {
            "os": "'"$os"'",
            "error": "Running as Root"
        }
    }' > /dev/null
    exit 1
fi

check_ports_occupied

read -rp 'Installation Directory [appsmith]: ' install_dir
install_dir="${install_dir:-appsmith}"
if [[ $install_dir != /* ]]; then
    # If it's not an absolute path, prepend current working directory to it, to make it an absolute path.
    install_dir="$PWD/$install_dir"
fi

if [[ -e "$install_dir" ]]; then
    echo "The path '$install_dir' is already present. Please run the script again with a different path to install new."
    echo "If you're trying to update your existing installation, that happens automatically through WatchTower."
    echo_contact_support " if you're facing problems with the auto-updates."
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "userId": "'"$APPSMITH_INSTALLATION_ID"'",
        "event": "Installation Error",
        "data": {
            "os": "'"$os"'",
            "error": "Directory Exists"
        }
    }' > /dev/null
    exit 1
fi

# Check is Docker daemon is installed and available. If not, the install & start Docker for Linux machines. We cannot automatically install Docker Desktop on Mac OS
if ! is_command_present docker; then
    if [[ $package_manager == "apt-get" || $package_manager == "zypper" || $package_manager == "yum" ]]; then
        install_docker
    else
        echo ""
        echo "+++++++++++ IMPORTANT READ ++++++++++++++++++++++"
        echo "Docker Desktop must be installed manually on Mac OS to proceed. Docker can only be installed automatically on Ubuntu / openSUSE / SLES / Redhat / Cent OS"
        echo "https://docs.docker.com/docker-for-mac/install/"
        echo "++++++++++++++++++++++++++++++++++++++++++++++++"
        curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
        --header 'Content-Type: text/plain' \
        --data-raw '{
            "userId": "'"$APPSMITH_INSTALLATION_ID"'",
            "event": "Installation Error",
            "data": {
                "os": "'"$os"'",
                "error": "Docker not installed"
            }
        }' > /dev/null
        exit 1
    fi
fi

# Install docker-compose
if ! is_command_present docker-compose; then
    install_docker_compose
fi

# Starting docker service
if [[ $package_manager == "yum" || $package_manager == "zypper" || $package_manager == "apt-get" ]]; then
    start_docker
fi

echo "Installing Appsmith to '$install_dir'."
mkdir -p "$install_dir"
echo ""

echo "Appsmith needs a MongoDB instance to run"
if confirm y "Initialise a new database? (Recommended)"; then
    mongo_host="mongo"
    mongo_database="appsmith"

    # We invoke functions to read the mongo credentials from the user because they MUST be non-empty
    read_mongo_username
    read_mongo_password

    # Since the mongo was automatically setup, this must be the first time installation. Generate encryption credentials for this scenario
    auto_generate_encryption="true"
else
    echo 'You are trying to connect to an existing appsmith database. Abort if you want to install appsmith using the default database'
    read -rp 'Enter your existing appsmith mongo db host: ' mongo_host
    read -rp 'Enter your existing appsmith mongo root user: ' mongo_root_user
    read -srp 'Enter your existing appsmith mongo password: ' mongo_root_password
    read -rp 'Enter your existing appsmith mongo database name: ' mongo_database
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

encryptionEnv=./template/encryption.env
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
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Custom Domain",
      "data": {
          "os": "'"$os"'"
       }
    }' > /dev/null
    echo ""
    echo "+++++++++++ IMPORTANT PLEASE READ ++++++++++++++++++++++"
    echo "Please update your DNS records with your domain registrar"
    echo "You can read more about this in our Documentation"
    echo "https://docs.appsmith.com/v/v1.1/quick-start#custom-domains"
    echo "+++++++++++++++++++++++++++++++++++++++++++++++"
    echo ""
    echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
    if confirm y '(Your DNS records must be updated for us to proceed)'; then
        read -rp 'Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com): ' custom_domain
    fi
fi

NGINX_SSL_CMNT=""
if [[ -z $custom_domain ]]; then
    NGINX_SSL_CMNT="#"
fi

ask_telemetry
echo ""
echo "Downloading the configuration templates..."
templates_dir="$(mktemp -d)"
mkdir -p "$templates_dir"

(
    cd "$templates_dir"
    curl --remote-name-all --silent --show-error \
        https://raw.githubusercontent.com/appsmithorg/appsmith/master/deploy/template/docker-compose.yml.sh \
        https://raw.githubusercontent.com/appsmithorg/appsmith/master/deploy/template/mongo-init.js.sh \
        https://raw.githubusercontent.com/appsmithorg/appsmith/master/deploy/template/docker.env.sh \
        https://raw.githubusercontent.com/appsmithorg/appsmith/master/deploy/template/nginx_app.conf.sh \
        https://raw.githubusercontent.com/appsmithorg/appsmith/master/deploy/template/encryption.env.sh
)

# Create needed folder structure.
mkdir -p "$install_dir/data/"{nginx,mongo/db}

echo ""
echo "Generating the configuration files from the templates"
bash "$templates_dir/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$custom_domain" > nginx_app.conf
bash "$templates_dir/docker-compose.yml.sh" "$mongo_root_user" "$mongo_root_password" "$mongo_database" > docker-compose.yml
bash "$templates_dir/mongo-init.js.sh" "$mongo_root_user" "$mongo_root_password" > mongo-init.js
bash "$templates_dir/docker.env.sh" "$encoded_mongo_root_user" "$encoded_mongo_root_password" "$mongo_host" "$disable_telemetry" > docker.env
if [[ "$setup_encryption" = "true" ]]; then
    bash "$templates_dir/encryption.env.sh" "$user_encryption_password" "$user_encryption_salt" > encryption.env
fi

overwrite_file "data/nginx/app.conf.template" "nginx_app.conf"
overwrite_file "docker-compose.yml" "docker-compose.yml"
overwrite_file "data/mongo/init.js" "mongo-init.js"
overwrite_file "docker.env" "docker.env"
overwrite_file "encryption.env" "encryption.env"

echo ""

cd "$install_dir"
if [[ -n $custom_domain ]]; then
    init_ssl_cert "$custom_domain"
else
    echo "No domain found. Skipping generation of SSL certificate."
fi

rm -rf "$templates_dir"

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
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "userId": "'"$APPSMITH_INSTALLATION_ID"'",
        "event": "Installation Error",
        "data": {
            "os": "'"$os"'",
            "error": "Containers not started"
        }
    }' > /dev/null
    exit 1
else
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Success",
      "data": {
          "os": "'"$os"'"
       }
    }' > /dev/null

    echo "++++++++++++++++++ SUCCESS ++++++++++++++++++++++"
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
    echo "Need help Getting Started?"
    echo "Join our Discord server https://discord.com/invite/rBTTVJp"
    echo ""
    echo "Please share your email to receive support & updates about appsmith!"
    read -rp 'Email: ' email
    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Identify Successful Installation",
      "data": {
          "os": "'"$os"'",
          "email": "'"$email"'"
       }
    }' > /dev/null
fi
echo -e "\Thank you!\n"
