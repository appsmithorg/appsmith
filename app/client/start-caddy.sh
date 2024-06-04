#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
if [[ -n ${TRACE-} ]]; then
    set -o xtrace
fi

{
  echo
  echo "-----------------------------------"
  echo " ⚠️ This script is WIP. Please use start-https.sh instead."
  echo "-----------------------------------"
  echo
} >&2


cd "$(dirname "$0")"

if [[ ${1-} =~ ^-*h(elp)?$ ]]; then
    echo 'Run '"$0"' [option...]
 --http: Require start with http, instead of the default HTTPS.

--https-port: Port to use for https. Default: 443.
 --http-port: Port to use for http. Default: 80.

        If neither of the above are set, then we use 443 for https, and 80 for http.

--env-file: Specify an alternate env file. Defaults to ".env" at the root of the project.

A single positional argument can be given to set the backend server proxy address. Example:

'"$0"' https://localhost:8080
'"$0"' https://host.docker.internal:8080
'"$0"' https://release.app.appsmith.com
'"$0"' release  # This is identical to the one above
' >&2
    exit
fi

use_https=1
run_as=caddy

while [[ $# -gt 0 ]]; do
    case $1 in
        --https)
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

working_dir="$PWD/caddy"
mkdir -pv "$working_dir"

domain=dev.appsmith.com

upstream_host=localhost

frontend_host=${frontend_host-$upstream_host}
backend_host=${backend_host-$upstream_host}
rts_host=${rts_host-$upstream_host}

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

caddy_dev_conf="$working_dir/Caddyfile"

APPSMITH_CUSTOM_DOMAIN="$domain" \
    TMP="$working_dir" \
    node \
    "$(git rev-parse --show-toplevel)/deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs" \
    --no-finalize-index-html

changed="$(awk '
/ root / || /import file_server/ { next }
/acme_ca_root/ { print "log {\n output file '"$working_dir/logs.txt"'\n}"; next }
/output stdout/ { print "output file '"$working_dir/logs.txt"'"; next }
/ handle {/ { skip = 1; print "handle {\n import reverse_proxy 3000\n templates {\n  mime \"text/html; charset=utf-8\"\n }\n}\n" }
/ handle \/info {/ { skip = 0 }
!skip { print }
/https:\/\/'"$domain"' / { print "tls internal" }
' "$caddy_dev_conf")"

echo "$changed" | caddy fmt - > "$caddy_dev_conf"

# Have to stop and start, instead of reload, so that any new env variables are picked up for Caddy's templating.
caddy stop --config "$caddy_dev_conf" || true
remaining_listeners="$(
    lsof -nP "-iTCP:$http_listen_port" -sTCP:LISTEN || true
    lsof -nP "-iTCP:$https_listen_port" -sTCP:LISTEN || true
)"
if [[ -n $remaining_listeners ]]; then
    echo $'\nThe following processes are listening on the ports we want to use:\n'"$remaining_listeners"$'\n' >&2
    answer=
    for attempt in 1 2 3; do
        echo -n 'Kill and proceed? [y/n] ' >&2
        read -rn1 answer
        if [[ $answer == y ]]; then
            (lsof -t "-iTCP:$http_listen_port" -sTCP:LISTEN | xargs kill) || true
            (lsof -t "-iTCP:$https_listen_port" -sTCP:LISTEN | xargs kill) || true
            break
        elif [[ $answer == n || $attempt == 3 ]]; then
            echo $'\nAborting.' >&2
            exit 1
        fi
    done
fi

caddy start --config "$caddy_dev_conf"
stop_cmd="caddy --config \"$caddy_dev_conf\" stop"

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

echo '✅ Started Caddy'
echo "ℹ️  Stop with: $stop_cmd"
echo "🎉 $url_to_open"
