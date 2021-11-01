#!/bin/bash

set -o nounset
REDIS_URL="$1"

cat <<EOF
priority: 600
jobs:
  - name:
    address: '$REDIS_URL'
EOF