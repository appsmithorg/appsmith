#!/bin/bash

# helpers function
move_file() {
    local relative_path="$1"
    local template_file="$2"
    local full_path="$install_dir/$relative_path"
    mv -f "$template_file" "$full_path"
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

bye() {  # Prints a friendly good bye message and exits the script.
    if [ "$?" -ne 0 ]; then
        set +o errexit

        curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
        --header 'Content-Type: text/plain' \
        --data-raw '{
            "userId": "'"$APPSMITH_INSTALLATION_ID"'",
            "event": "Installation Support",
            "data": {
                "os": "ubuntu",
                "platform" : "aws_ami"
            }
        }' > /dev/null
        exit 0
    fi
}


generate_random_string() {
    # Picked up the following method of generation from : https://gist.github.com/earthgecko/3089509
    LC_CTYPE=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 13 | head -n 1
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

## Default configuration
install_dir="/home/ubuntu/appsmith"
mongo_host="mongo"
mongo_database="appsmith"
mongo_root_user=$(generate_random_string)
mongo_root_password=$(generate_random_string)
user_encryption_password=$(generate_random_string)
user_encryption_salt=$(generate_random_string)
disable_telemetry="false"
NGINX_SSL_CMNT="#"

APPSMITH_INSTALLATION_ID=$(curl -s 'https://api64.ipify.org')

trap bye EXIT

curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
--header 'Content-Type: text/plain' \
--data-raw '{
  "userId": "'"$APPSMITH_INSTALLATION_ID"'",
  "event": "Installation Started",
  "data": {
    "os": "ubuntu",
    "platform": "aws_ami"
   }
}' > /dev/null

# Step 1: Download the templates
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
# Step 2: Generate config from template
mkdir -p "$install_dir/data/"{nginx,mongo/db}
echo "Generating the configuration files from the templates"
bash "$templates_dir/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$custom_domain" > nginx_app.conf
bash "$templates_dir/docker-compose.yml.sh" "$mongo_root_user" "$mongo_root_password" "$mongo_database" > docker-compose.yml
bash "$templates_dir/mongo-init.js.sh" "$mongo_root_user" "$mongo_root_password" > mongo-init.js
bash "$templates_dir/docker.env.sh" "$mongo_database" "$mongo_root_user" "$mongo_root_password" "$mongo_host" "$disable_telemetry" > docker.env
bash "$templates_dir/encryption.env.sh" "$user_encryption_password" "$user_encryption_salt" > encryption.env

move_file "data/nginx/app.conf.template" "nginx_app.conf"
move_file "docker-compose.yml" "docker-compose.yml"
move_file "data/mongo/init.js" "mongo-init.js"
move_file "docker.env" "docker.env"
move_file "encryption.env" "encryption.env"
rm -rf "$templates_dir"

# Step 3: Pulling the latest container images
cd $install_dir;
echo ""
echo "Pulling the latest container images"
docker-compose pull
echo ""
# Step 4: Starting the Appsmith containers
echo "Starting the Appsmith containers"
docker-compose up --detach --remove-orphans

wait_for_containers_start 60
if [[ $status_code -eq 401 ]]; then
    echo "Installation is complete!"
    echo "Creating default user"
    while [ ! -f $install_dir/credential ]
    do
        echo -ne "Waiting to credential file to be created...\r\c"
        sleep 2
    done
    line=$(head -n 1 ./credential)
    IFS=':' read -r -a tokens <<< "$line"
    default_user_name="${tokens[0]}"
    default_user_password="${tokens[1]}"

    curl -k -X POST 'http://localhost/api/v1/users' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "name" : "'"$default_user_name"'",
        "email" : "'"$default_user_name"'",
        "source" : "FORM",
        "state" : "ACTIVATED",
        "isEnabled" : "true",
        "password": "'"$default_user_password"'"
    }'

    curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Installation Success",
      "data": {
          "os": "ubuntu",
          "platform": "aws_ami"
       }
    }' > /dev/null
fi
