certbot_cmd() {
    sudo docker-compose run --rm --entrypoint "$1" certbot
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

install_dir="/home/ubuntu/appsmith"
domain="$1"
echo "Creating certificate for '$domain'."

rsa_key_size=4096
data_path="$install_dir/data/certbot"

sudo chown -R ubuntu:ubuntu "$data_path"

if [ -d "$data_path/conf/keys" ] && [ -d "$data_path/conf/live" ]; then
    if ! confirm n "Existing certificate data found at '$data_path'. Continue and replace existing certificate?"; then
        exit 0
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

echo "### Generating OpenSSL key for '$domain'..."
live_path="/etc/letsencrypt/live/$domain"

cd "$install_dir"

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

APPSMITH_INSTALLATION_ID=$(curl -s 'https://api64.ipify.org')

curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
      "userId": "'"$APPSMITH_INSTALLATION_ID"'",
      "event": "Configure SSL Successfully",
      "data": {
          "os": "Ubuntu"
          "platform": "aws_ami"
       }
    }' > /dev/null
