#!/usr/bin/env bash

set -e

check_initialized_db() {
	echo 'Check initialized database'
	shouldPerformInitdb=1
	for path in \
		"$MONGO_DB_PATH/WiredTiger" \
		"$MONGO_DB_PATH/journal" \
		"$MONGO_DB_PATH/local.0" \
		"$MONGO_DB_PATH/storage.bson"; do
		if [ -e "$path" ]; then
			shouldPerformInitdb=0
			return
		fi
	done
	echo "Should initialize database"
}

init_mongodb() {
	echo "Init database"
	MONGO_DB_PATH="/appsmith-stacks/data/mongodb"
	MONGO_LOG_PATH="$MONGO_DB_PATH/log"
	MONGO_DB_KEY="$MONGO_DB_PATH/key"
	mkdir -p "$MONGO_DB_PATH"
	touch "$MONGO_LOG_PATH"

	check_initialized_db

	if [[ $shouldPerformInitdb -gt 0 ]]; then
		# Start installed MongoDB service - Dependencies Layer
		mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH"
		echo "Waiting 10s for mongodb init"
		sleep 10
		bash "/opt/appsmith/templates/mongo-init.js.sh" "$MONGO_INITDB_ROOT_USERNAME" "$MONGO_INITDB_ROOT_PASSWORD" >"/appsmith-stacks/configuration/mongo-init.js"
		mongo "127.0.0.1/${MONGO_INITDB_DATABASE}" /appsmith-stacks/configuration/mongo-init.js
		echo "Seeding db done"

		echo "Enable replica set"
		mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
		echo "Fork process"
		openssl rand -base64 756 >"$MONGO_DB_KEY"
		chmod go-rwx,u-wx "$MONGO_DB_KEY"
		mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH" --replSet mr1 --keyFile "$MONGO_DB_KEY" --bind_ip localhost
		echo "Waiting 10s for mongodb init with replica set"
		sleep 10
		mongo "$APPSMITH_MONGODB_URI" --eval 'rs.initiate()'
		mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
	fi
}

init_ssl_cert() {
	local domain="$1"
	NGINX_SSL_CMNT=""

	local rsa_key_size=4096
	local data_path="/appsmith-stacks/data/certificate"

	mkdir -p "$data_path" "$data_path"/{conf,www}

	if ! [[ -e "$data_path/conf/options-ssl-nginx.conf" && -e "$data_path/conf/ssl-dhparams.pem" ]]; then
		echo "Downloading recommended TLS parameters..."
		curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf >"$data_path/conf/options-ssl-nginx.conf"
		curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem >"$data_path/conf/ssl-dhparams.pem"
		echo
	fi

	echo "Re-generating nginx config template with domain"
	bash "/opt/appsmith/templates/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$APPSMITH_CUSTOM_DOMAIN" >"/etc/nginx/conf.d/nginx_app.conf.template"

	echo "Generating nginx configuration"
	cat /etc/nginx/conf.d/nginx_app.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/sites-available/default

	local live_path="/etc/letsencrypt/live/$domain"
	if [[ -e "$live_path" ]]; then
		echo "Existing certificate for domain $domain"
		nginx -s reload
		return
	fi

	echo "Creating certificate for '$domain'"

	echo "Requesting Let's Encrypt certificate for '$domain'..."
	echo "Generating OpenSSL key for '$domain'..."

	mkdir -p "$live_path" && openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
		-keyout "$live_path/privkey.pem" \
		-out "$live_path/fullchain.pem" \
		-subj "/CN=localhost"

	echo "Reload Nginx"
	nginx -s reload

	echo "Removing key now that validation is done for $domain..."
	rm -Rfv /etc/letsencrypt/live/$domain /etc/letsencrypt/archive/$domain /etc/letsencrypt/renewal/$domain.conf

	echo "Generating certification for domain $domain"
	mkdir -p "$data_path/certbot"
	certbot certonly --webroot --webroot-path="$data_path/certbot" \
		--register-unsafely-without-email \
		--domains $domain \
		--rsa-key-size $rsa_key_size \
		--agree-tos \
		--force-renewal

	echo "Reload nginx"
	nginx -s reload
}

configure_ssl() {
	NGINX_SSL_CMNT="#"

	echo "Mounting Let's encrypt folder"
	rm -rf /etc/letsencrypt
	mkdir -p /appsmith-stacks/letsencrypt
	ln -s /appsmith-stacks/letsencrypt /etc/letsencrypt

	echo "Generating nginx config template without domain"
	bash "/opt/appsmith/templates/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$APPSMITH_CUSTOM_DOMAIN" > "/etc/nginx/conf.d/nginx_app.conf.template"

	echo "Generating nginx configuration"
	cat /etc/nginx/conf.d/nginx_app.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > /etc/nginx/sites-available/default
	nginx

	if [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then
		init_ssl_cert "$APPSMITH_CUSTOM_DOMAIN"
	fi
	nginx -s stop
}

configure_supervisord() {
	SUPERVISORD_CONF_PATH="/opt/appsmith/templates/supervisord"
	if [[ -f "/etc/supervisor/conf.d/"*.conf ]]; then
		rm "/etc/supervisor/conf.d/"*
	fi

	cp -f "$SUPERVISORD_CONF_PATH/application_process/"*.conf /etc/supervisor/conf.d
	if [[ "$APPSMITH_MONGODB_URI" = "mongodb://appsmith:$MONGO_INITDB_ROOT_PASSWORD@localhost/appsmith" ]]; then
		cp "$SUPERVISORD_CONF_PATH/mongodb.conf" /etc/supervisor/conf.d/
	fi
	if [[ "$APPSMITH_REDIS_URL" = "redis://127.0.0.1:6379" ]]; then
		cp "$SUPERVISORD_CONF_PATH/redis.conf" /etc/supervisor/conf.d/
	fi
}

echo 'Checking configuration file'
CONF_PATH="/appsmith-stacks/configuration"
ENV_PATH="$CONF_PATH/docker.env"
if ! [[ -e "$ENV_PATH" ]]; then
	echo "Generating default configuration file"
	mkdir -p "$CONF_PATH"
	AUTO_GEN_MONGO_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13 ; echo '')
	AUTO_GEN_ENCRYPTION_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13 ; echo '')
	AUTO_GEN_ENCRYPTION_SALT=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13 ; echo '')
	bash "/opt/appsmith/templates/docker.env.sh" "$AUTO_GEN_MONGO_PASSWORD" "$AUTO_GEN_ENCRYPTION_PASSWORD" "$AUTO_GEN_ENCRYPTION_SALT" > "$ENV_PATH"
fi

if [[ -f "$ENV_PATH" ]]; then
	sed -i 's/APPSMITH_MONGO_USERNAME/MONGO_INITDB_ROOT_USERNAME/; s/APPSMITH_MONGO_PASSWORD/MONGO_INITDB_ROOT_PASSWORD/; s/APPSMITH_MONGO_DATABASE/MONGO_INITDB_DATABASE/' "$ENV_PATH"
	echo 'Load environment configuration'
	set -o allexport
	. "$ENV_PATH"
	set +o allexport
fi

# Check for enviroment vairalbes
echo 'Checking environment configuration'
if [[ -z "${APPSMITH_MAIL_ENABLED}" ]]; then
	unset APPSMITH_MAIL_ENABLED # If this field is empty is might cause application crash
fi

if [[ -z "${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}" ]] || [[ -z "${APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET}" ]]; then
	unset APPSMITH_OAUTH2_GITHUB_CLIENT_ID # If this field is empty is might cause application crash
	unset APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET
fi

if [[ -z "${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}" ]] || [[ -z "${APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET}" ]]; then
	unset APPSMITH_OAUTH2_GOOGLE_CLIENT_ID # If this field is empty is might cause application crash
	unset APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET
fi

if [[ -z "${APPSMITH_GOOGLE_MAPS_API_KEY}" ]]; then
	unset APPSMITH_GOOGLE_MAPS_API_KEY
fi

if [[ -z "${APPSMITH_RECAPTCHA_SITE_KEY}" ]] || [[ -z "${APPSMITH_RECAPTCHA_SECRET_KEY}" ]] || [[ -z "${APPSMITH_RECAPTCHA_ENABLED}" ]]; then
	unset APPSMITH_RECAPTCHA_SITE_KEY # If this field is empty is might cause application crash
	unset APPSMITH_RECAPTCHA_SECRET_KEY
	unset APPSMITH_RECAPTCHA_ENABLED
fi

# Main Section
init_mongodb
configure_ssl
configure_supervisord

# Ensure the restore path exists in the container, so an archive can be copied to it, if need be.
mkdir -p /appsmith-stacks/data/{backup,restore}

# Handle CMD command
exec "$@"
