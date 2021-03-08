#!/bin/bash
set -o errexit

install_dir="/home/ubuntu/appsmith"
config_ssl_pwd=$(pwd)

confirm() {
    local default="$1" # Should be `y` or `n`.
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

ssl_enable=false

read -rp 'Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com): ' custom_domain
echo "Would you like to provision an SSL certificate for your custom domain / subdomain?"
if confirm y '(Your DNS records must be updated for us to proceed)'; then
    ssl_enable=true

    read -rp 'Enter email address to create SSL certificate: (Optional, but strongly recommended): ' email
    if [[ -z $email ]]; then
        email_arg="--register-unsafely-without-email"
    else
        email_arg="--email $email --no-eff-email"
    fi

    if confirm n 'Do you want to create certificate in staging mode (which is used for dev purposes and is not subject to rate limits)?'; then
        staging_arg="--staging"
    else
        staging_arg=""
    fi
fi

if [[ $ssl_enable == false ]]; then
    NGINX_SSL_CMNT="#"
fi

sed -i "s|APPSMITH_DOMAIN=|APPSMITH_DOMAIN=$custom_domain|" $install_dir/docker.env
sed -i "s|APPSMITH_SSL_ENABLED=|APPSMITH_SSL_ENABLED=$ssl_enable|" $install_dir/docker.env
sed -i "s|APPSMITH_SSL_EMAIL=|APPSMITH_SSL_EMAIL=$email|" $install_dir/docker.env
sed -i "s|APPSMITH_SSL_ENV=|APPSMITH_SSL_ENV=$staging_arg|" $install_dir/docker.env

current_dir=$(pwd)
init_letsencrypt_file="$config_ssl_pwd/init-letsencrypt.sh"

if [[ $ssl_enable == true ]]; then
    sudo chown ubuntu:ubuntu "$init_letsencrypt_file" && sudo chmod +x "$init_letsencrypt_file"
    /bin/bash "$init_letsencrypt_file" "$custom_domain" "$email_arg" "$staging_arg"
fi

echo "+++++++++++ SUCCESS ++++++++++++++++++++++++++++++"
echo "Your installation is complete!"
echo ""

if [[ $ssl_enable == false ]]; then
    echo "Your application is running on 'http://$custom_domain'."
else
    echo "Your application is running on 'https://$custom_domain'."
fi
