#!/bin/bash

# helpers function
move_file() {
    local relative_path="$1"
    local template_file="$2"
    local full_path="$install_dir/$relative_path"
    mv -f "$template_file" "$full_path"
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
NGINX_SSL_CMNT="#"

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
bash "$templates_dir/docker.env.sh" "$mongo_root_user" "$mongo_root_password" "$mongo_host" > docker.env
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

echo -e "\nPeace out \U1F596\n"
