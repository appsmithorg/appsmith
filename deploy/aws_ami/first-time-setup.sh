#!/bin/bash

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
echo "Downloading the Docker Compose file..."
mkdir -p "$install_dir"
(
    cd "$install_dir"
    curl -L https://github.com/appsmithorg/appsmith/raw/master/deploy/aws_ami/docker-compose.yml -o $PWD/docker-compose.yml
)

# Step 2: Pulling the latest container images
cd $install_dir;
echo ""
echo "Pulling the latest container images"
docker-compose pull
echo ""
# Step 3: Starting the Appsmith containers
echo "Starting the Appsmith containers"
docker-compose up --detach --remove-orphans

# This timeout is set to 180 seconds to wait for all services (MongoDB, Redis, Backend, RTS) to be ready
wait_for_containers_start 180
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

    curl -k -X POST 'http://localhost/api/v1/users/super' \
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
