#!/bin/bash

set -o nounset
CUSTOM_DOMAIN="$1"

cat <<EOF
priority: 550
jobs:
  - name: $CUSTOM_DOMAIN
    source: https://$CUSTOM_DOMAIN:443
    days_until_expiration_warning: 10
    days_until_expiration_critical: 3
EOF