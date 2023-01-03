#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
if [[ -n ${TRACE-} ]]; then
    set -o xtrace
fi

cd "$(dirname "$0")"

if [[ ${1-} =~ ^-*h(elp)?$ ]]; then
    echo 'Run '"$0"' [option...]

   --with-docker: Start NGINX with Docker. Fail if Docker is not available.
--without-docker: Start NGINX directly. Fail if NGINX is not installed.

        If neither of the above are set, we check if NGINX is installed, and use that if yes, or Docker otherwise.

--https: Require start with https.
 --http: Require start with http.

        If neither of the above ar set, then we check if mkcert is available, and use https if yes, or http otherwise.

--https-port: Port to use for https. Default: 443.
 --http-port: Port to use for http. Default: 80.

        If neither of the above are set, then we use 443 for https, and 80 for http.

--env-file: Specify an alternate env file. Defaults to '.env' at the root of the project.

A single positional argument can be given to set the backend server proxy address. Example:

'"$0"' https://localhost:8080
'"$0"' https://host.docker.internal:8080
'"$0"' https://release.app.appsmith.com
'"$0"' release  # This is identical to the one above
' >&2
    exit
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        --with-docker)
            run_as=docker
            shift
            ;;
        --without-docker)
            run_as=nginx
            shift
            ;;
        --https)
            use_https=1
            shift
            ;;
        --http)
            use_https=0
            shift
            ;;
        --https-port)
            https_listen_port=$2
            shift 2
            ;;
        --http-port)
            http_listen_port=$2
            shift 2
            ;;
        --env-file)
            env_file=$2
            shift
            shift
            ;;
        -*|--*)
            echo "Unknown option $1" >&2
            exit 1
            ;;
        *)
            backend="$1"
            shift
            ;;
    esac
done

if [[ ${backend-} == release ]]; then
  # Special shortcut for release environment.
  backend=https://release.app.appsmith.com
fi

if [[ -z ${run_as-} ]]; then
    if type nginx; then
        run_as=nginx
    elif type docker; then
        run_as=docker
    else
        echo 'Could not find nginx or docker. Do a "brew install nginx" and try again.'
        exit
    fi
fi

if [[ $run_as == docker ]]; then
    echo 'Running with Docker. You may "brew install nginx" to run this without Docker.'
fi

working_dir="$PWD/nginx"
mkdir -pv "$working_dir"

domain=dev.appsmith.com

key_file="$working_dir/$domain-key.pem"
cert_file="$working_dir/$domain.pem"

if [[ -z ${use_https-} ]]; then
    if type mkcert; then
        use_https=1
    else
        echo 'SSL cert isn'\''t there, and "mkcert" is not installed either. Starting with http.' >&2
        echo 'Please "brew install mkcert" and re-run this script to start with https.' >&2
        use_https=0
    fi
fi

if [[ $use_https == 1 ]]; then
    if ! [[ -f $key_file && -f $cert_file ]]; then
        if type mkcert; then
            pushd "$working_dir"
            mkcert -install
            mkcert "$domain"
            popd
        else
            echo 'I got "--use-https", but "mkcert" is not available. Please "brew install mkcert" and try again.' >&2
            exit 1
        fi
    fi
fi

upstream_host=localhost
if [[ $run_as == docker ]]; then
    upstream_host=host.docker.internal
fi

frontend_host=${frontend_host-$upstream_host}
backend_host=${backend_host-$upstream_host}
rts_host=${rts_host-$upstream_host}

frontend_port=${frontend_port-3000}
backend_port=${backend_port-8080}
rts_port=${rts_port-8091}

backend="${backend-http://$backend_host:$backend_port}"
frontend="http://$frontend_host:$frontend_port"
rts="http://$rts_host:$rts_port"

http_listen_port="${http_listen_port-80}"
https_listen_port="${https_listen_port-443}"


if [[ -n ${env_file-} && ! -f $env_file ]]; then
    echo "I got --env-file as '$env_file', but I cannot access it." >&2
    exit 1
elif [[ -n ${env_file-} || -f ../../.env ]]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "${env_file-../../.env}"
    set +o allexport
else
    echo "
        Please populate the .env at the root of the project and run again
        Or add the environment variables defined in .env.example to the environment
        -- to enable features
    " >&2
fi


if [[ -f /etc/nginx/mime.types || $run_as == docker ]]; then
    mime_types=/etc/nginx/mime.types
elif type nginx >/dev/null; then
    mime_types="$(dirname "$(nginx -t 2>&1 | head -1 | cut -d' ' -f5)")/mime.types"
    if [[ ! -f $mime_types ]]; then
        mime_types=
    fi
fi

if [[ -z ${mime_types-} ]]; then
    echo "No mime.types file found. Can't start NGINX." >&2
    exit 1
fi


nginx_pid="$working_dir/wildcard-nginx.pid"
nginx_access_log="$working_dir/access.log"
nginx_error_log="$working_dir/error.log"
rm -f "$nginx_access_log" "$nginx_error_log"

nginx_dev_conf="$working_dir/nginx.dev.conf"

# Rare case, if this file doesn't exist, and the `docker run` command
# (from further below) the script runs, then it'll auto-create a _directory_
# at this path, breaking this script after that.
rm -rf "$nginx_dev_conf"

worker_connections=1024

echo "
worker_processes  1;

error_log $nginx_error_log info;

$(if [[ $run_as == nginx ]]; then echo "pid $nginx_pid;"; fi)

events {
    worker_connections $worker_connections;
}

http {
    map \$http_x_forwarded_proto \$origin_scheme {
        default \$http_x_forwarded_proto;
        '' \$scheme;
    }

    include $mime_types;
    default_type application/octet-stream;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    access_log $nginx_access_log;

    gzip on;
    gzip_types *;

$(if [[ $use_https == 1 ]]; then echo "
    server {
        listen $http_listen_port default_server;
        server_name $domain;
        return 301 https://\$host$(if [[ $https_listen_port != 443 ]]; then echo ":$https_listen_port"; fi)\$request_uri;
    }
"; fi)

    server {
$(if [[ $use_https == 1 ]]; then echo "
        listen $https_listen_port ssl http2 default_server;
        server_name $domain;
        ssl_certificate '$cert_file';
        ssl_certificate_key '$key_file';
"; else echo "
        listen $http_listen_port default_server;
        server_name _;
"; fi)

        client_max_body_size 100m;
        gzip on;

        proxy_ssl_server_name on;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header X-Forwarded-Proto \$origin_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Accept-Encoding '';

        sub_filter_once off;
        location / {
            proxy_pass $frontend;
            sub_filter __APPSMITH_SENTRY_DSN__ '${APPSMITH_SENTRY_DSN-}';
            sub_filter __APPSMITH_SMART_LOOK_ID__ '${APPSMITH_SMART_LOOK_ID-}';
            sub_filter __APPSMITH_OAUTH2_GOOGLE_CLIENT_ID__ '${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID-}';
            sub_filter __APPSMITH_OAUTH2_GITHUB_CLIENT_ID__ '${APPSMITH_OAUTH2_GITHUB_CLIENT_ID-}';
            sub_filter __APPSMITH_MARKETPLACE_ENABLED__ '${APPSMITH_MARKETPLACE_ENABLED-}';
            sub_filter __APPSMITH_SEGMENT_KEY__ '${APPSMITH_SEGMENT_KEY-}';
            sub_filter __APPSMITH_ALGOLIA_API_ID__ '${APPSMITH_ALGOLIA_API_ID-}';
            sub_filter __APPSMITH_ALGOLIA_SEARCH_INDEX_NAME__ '${APPSMITH_ALGOLIA_SEARCH_INDEX_NAME-}';
            sub_filter __APPSMITH_ALGOLIA_API_KEY__ '${APPSMITH_ALGOLIA_API_KEY-}';
            sub_filter __APPSMITH_CLIENT_LOG_LEVEL__ '${APPSMITH_CLIENT_LOG_LEVEL-}';
            sub_filter __APPSMITH_GOOGLE_MAPS_API_KEY__ '${APPSMITH_GOOGLE_MAPS_API_KEY-}';
            sub_filter __APPSMITH_TNC_PP__ '${APPSMITH_TNC_PP-}';
            sub_filter __APPSMITH_SENTRY_RELEASE__ '${APPSMITH_SENTRY_RELEASE-}';
            sub_filter __APPSMITH_SENTRY_ENVIRONMENT__ '${APPSMITH_SENTRY_ENVIRONMENT-}';
            sub_filter __APPSMITH_VERSION_ID__ '${APPSMITH_VERSION_ID-}';
            sub_filter __APPSMITH_VERSION_RELEASE_DATE__ '${APPSMITH_VERSION_RELEASE_DATE-}';
            sub_filter __APPSMITH_INTERCOM_APP_ID__ '${APPSMITH_INTERCOM_APP_ID-}';
            sub_filter __APPSMITH_MAIL_ENABLED__ '${APPSMITH_MAIL_ENABLED-}';
            sub_filter __APPSMITH_DISABLE_TELEMETRY__ '${APPSMITH_DISABLE_TELEMETRY-}';
            sub_filter __APPSMITH_CLOUD_SERVICES_BASE_URL__ '${APPSMITH_CLOUD_SERVICES_BASE_URL-}';
            sub_filter __APPSMITH_RECAPTCHA_SITE_KEY__ '${APPSMITH_RECAPTCHA_SITE_KEY-}';
            sub_filter __APPSMITH_DISABLE_INTERCOM__ '${APPSMITH_DISABLE_INTERCOM-}';
            sub_filter __APPSMITH_FORM_LOGIN_DISABLED__ '${APPSMITH_FORM_LOGIN_DISABLED-}';
            sub_filter __APPSMITH_SIGNUP_DISABLED__ '${APPSMITH_SIGNUP_DISABLED-}';
            sub_filter __APPSMITH_ZIPY_SDK_KEY__ '${APPSMITH_ZIPY_SDK_KEY-}';
            sub_filter __APPSMITH_HIDE_WATERMARK__ '${APPSMITH_HIDE_WATERMARK-}';
            sub_filter __APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX__ '${APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX-}';
        }

        location /api {
            proxy_pass $backend;
        }

        location /oauth2 {
            proxy_pass $backend;
        }

        location /login {
            proxy_pass $backend;
        }

        location /rts {
            proxy_pass $rts;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header Connection upgrade;
            proxy_set_header Upgrade \$http_upgrade;
        }
    }
}
" > "$nginx_dev_conf"

if type docker &>/dev/null; then
    docker rm --force wildcard-nginx >/dev/null 2>&1 || true
fi

if [[ -f $nginx_pid ]]; then
    # We never run `nginx` without the `-c` argument, since that can load the default system configuration, which is
    # different for different systems. It introduces too many unknowns, with little value.
    # So we build a temp config, just to have a predictable value for the `pid` directive.
    temp_nginx_conf="$working_dir/temp.nginx.conf"
    echo "pid $nginx_pid; events { worker_connections $worker_connections; }" > "$temp_nginx_conf"
    if ! nginx -c "$temp_nginx_conf" -s quit; then
      echo "Failed to stop nginx. This is _probably_ okay, and things should work fine." >&2
      echo "  If not, try running 'lsof -iTCP:80 -sTCP:LISTEN -nPt | xargs kill', and then re-run this script." >&2
    fi
    # The above stop command will delete the pid file, but we still do this to ensure it really is gone.
    rm -f "$nginx_pid" "$temp_nginx_conf"
    unset temp_nginx_conf
fi

if [[ $run_as == nginx ]]; then
    nginx -c "$nginx_dev_conf"
    stop_cmd="nginx -c '$nginx_dev_conf' -s quit"

elif [[ $run_as == docker ]]; then
    docker run \
        --name wildcard-nginx \
        --detach \
        --publish 80:80 \
        --publish 443:443 \
        --add-host=host.docker.internal:host-gateway \
        --volume "$nginx_dev_conf:/etc/nginx/nginx.conf:ro" \
        --volume "$working_dir:$working_dir" \
        nginx:alpine \
        >/dev/null
    stop_cmd='docker rm --force wildcard-nginx'

else
    echo "I don't know how to start NGINX with '$run_as'."

fi

url_to_open=""
if [[ $use_https == 1 ]]; then
    url_to_open="https://$domain"
    if [[ $https_listen_port != 443 ]]; then
        url_to_open="$url_to_open:$https_listen_port"
    fi
else
    url_to_open="http://localhost"
    if [[ $http_listen_port != 80 ]]; then
        url_to_open="$url_to_open:$http_listen_port"
    fi
fi

echo '✅ Started NGINX'
echo "ℹ️  Stop with: $stop_cmd"
echo "🎉 $url_to_open"
