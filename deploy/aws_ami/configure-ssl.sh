#!/bin/bash
set -o errexit

install_dir="/home/ubuntu/appsmith"
config_ssl_pwd=$(pwd)

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

read -rp 'Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com): ' custom_domain
echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
if confirm y '(Your DNS records must be updated for us to proceed)'; then
    ssl_enable="true"
fi

if [[ -z ssl_enable ]]; then
    NGINX_SSL_CMNT="#"
fi

templates_dir="$(mktemp -d)"
mkdir -p "$templates_dir"

cd "$templates_dir"
curl --remote-name-all --silent --show-error \
    https://raw.githubusercontent.com/appsmithorg/appsmith/master/deploy/template/nginx_app.conf.sh \

bash "$templates_dir/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$custom_domain" > "$install_dir/data/nginx/app.conf.template"

current_dir=$(pwd)
init_letsencrypt_file="$config_ssl_pwd/init-letsencrypt.sh"

if ! [[ -z $ssl_enable ]]; then
    sudo chown ubuntu:ubuntu "$init_letsencrypt_file" && sudo chmod +x "$init_letsencrypt_file"
    /bin/bash "$init_letsencrypt_file" "$custom_domain"
fi

echo "+++++++++++ SUCCESS ++++++++++++++++++++++++++++++"
echo "Your installation is complete!"
echo ""

if [[ -z $ssl_enable ]]; then
    echo "Your application is running on 'http://$custom_domain'."
else
    echo "Your application is running on 'https://$custom_domain'."
fi

