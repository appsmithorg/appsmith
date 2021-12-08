#!/bin/bash

set -o nounset
MONGODB_URI="$1"

MONGODB_PROTOCOL=$(echo "$MONGODB_URI" | grep -oP "[a-z+]+(?=\:\/\/)")
MONGODB_PASSWORD=$(echo "$MONGODB_URI" | grep -oP "\w+(?=@)")
MONGODB_HOST=$(echo "$MONGODB_URI" | grep -oP "(?<=\@)[a-z0-9.]+(?=\:)")
MONGODB_PORT=$(echo "$MONGODB_URI" | grep -oP "[a-z0-9.]+(?=\/)")
if [[ -z $MONGODB_HOST ]]; then
	MONGODB_PORT='27017'
	MONGODB_HOST=$(echo "$MONGODB_URI" | grep -oP "[a-z0-9.]+(?=\/)")
fi
MONGODB_DATABASE=$(echo "$MONGODB_URI" | grep -oP "\w+(?!\S)")

if ! [[ "$MONGODB_PROTOCOL" = "mongodb" ]]; then
  echo "Protocol $MONGODB_PROTOCOL is not currently supported by Netdata" >&2
  exit 0
fi

cat <<EOF
priority: 650
mongodb:
  name: ''
  authdb: '$MONGODB_DATABASE'
  host : '$MONGODB_HOST'
  port : $MONGODB_PORT
  user : 'netdata'
  pass : '$MONGODB_PASSWORD'
EOF