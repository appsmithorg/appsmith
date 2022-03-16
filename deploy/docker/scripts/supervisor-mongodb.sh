#!/usr/bin/env bash

set -e

ENV_PATH="/appsmith-stacks/configuration/docker.env"
SUPERVISOR_CONF_PATH="/etc/supervisor/conf.d/"
echo 'Load environment configuration'
set -o allexport
. "$ENV_PATH"
set +o allexport

check_mongodb_uri() {
  echo "Check mongodb uri host"
  isUriLocal=1
  if [[ $APPSMITH_MONGODB_URI == *"localhost"* || $APPSMITH_MONGODB_URI == *"127.0.0.1"* ]]; then
    echo "Use local MongoDB"
    isUriLocal=0
  fi
}

update_supervisord_mongodb_conf() {
  echo "Update supervisord mongodb conf"
  cd "$SUPERVISOR_CONF_PATH"
  if [ $isUriLocal -eq 1 ]; then
    echo "disable MongoDB supervisord"
    ls | grep -i mongodb | sed -e "p;s/\.conf/\.disable/" | xargs -n2 mv
  else
    echo "enable MongoDB supervisord"
    ls | grep -i mongodb | sed -e "p;s/\.disable/\.conf/" | xargs -n2 mv
  fi
}

check_mongodb_uri
update_supervisord_mongodb_conf
supervisorctl update
supervisorctl restart backend editor rts
