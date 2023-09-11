#!/bin/bash

set -o nounset

python3 /opt/appsmith/starting-page-init.py
rm -f "$NGINX_WWW_PATH/loading.html"
