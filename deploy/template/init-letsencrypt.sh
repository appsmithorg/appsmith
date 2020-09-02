#!/bin/bash

set -o nounset
set -o errexit

if ! [[ -x "$(command -v docker-compose)" ]]; then
    echo 'Error: docker-compose is not installed.' >&2
    exit 1
fi

domains=("$@")
echo "Have ${#domains[@]} domain(s) to create certificates for."
echo "domains: '${domains[*]}'."

rsa_key_size=4096
data_path="./data/certbot"
email="" # Adding a valid address is strongly recommended
staging=1 # Set to 1 if you're testing your setup to avoid hitting request limits

if [[ -d "$data_path" ]]; then
    read -rp "Existing certificate data found at '$data_path'. Continue and replace existing certificate? [y/N] " decision
    if [[ "$decision" != "Y" && "$decision" != "y" ]]; then
        exit
    fi
fi

mkdir -p "$data_path"/{conf,www}

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
    echo "### Downloading recommended TLS parameters..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
    echo
fi

for domain in "${domains[@]}"; do
    echo "### Creating dummy certificate for '$domain'..."
    live_path="/etc/letsencrypt/live/$domain"
    docker-compose run --rm --entrypoint \
        "sh -c \"mkdir -p '$live_path' && openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
            -keyout '$live_path/privkey.pem' \
            -out '$live_path/fullchain.pem' \
            -subj '/CN=localhost' \
            \"" \
        certbot
    echo
done

echo "### Starting nginx..."
docker-compose up --force-recreate --detach nginx
echo

for domain in "${domains[@]}"; do
    echo "### Deleting dummy certificate for $domain..."
    docker-compose run --rm --entrypoint "\
            rm -Rf /etc/letsencrypt/live/$domain && \
            rm -Rf /etc/letsencrypt/archive/$domain && \
            rm -Rf /etc/letsencrypt/renewal/$domain.conf" \
        certbot
done
echo

echo "### Requesting Let's Encrypt certificate for '${domains[*]}'..."
domain_args=""
for domain in "${domains[@]}"; do
    domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
    "") email_arg="--register-unsafely-without-email" ;;
    *) email_arg="--email $email --no-eff-email" ;;
esac

# Enable staging mode if needed
staging_arg=""
if [[ $staging != "0" ]]; then
    staging_arg="--staging"
fi

# The following command exits with a non-zero status code even if the certificate was generated, but some checks failed.
# So we explicitly ignore such failure with a `|| true` in the end, to avoid bash quitting on us because this looks like
# a failed command.
docker-compose run --rm --entrypoint "\
        certbot certonly --webroot -w /var/www/certbot \
            $staging_arg \
            $email_arg \
            $domain_args \
            --rsa-key-size $rsa_key_size \
            --agree-tos \
            --force-renewal" \
    certbot \
    || true
echo

echo "### Reloading nginx..."
docker-compose exec nginx nginx -s reload
