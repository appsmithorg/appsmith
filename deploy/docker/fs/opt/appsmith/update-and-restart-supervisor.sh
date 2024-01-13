#!/usr/bin/env bash

set -e
set -o xtrace

ENV_PATH="/appsmith-stacks/configuration/docker.env"
SUPERVISORD_CONF_PATH="/opt/appsmith/templates/supervisord"
echo 'Load environment configuration'
set -o allexport
. "$ENV_PATH"
set +o allexport

check_mongodb_uri() {
  echo "Check MongoDB uri host"
  isLocalMongo=1
  if [[ $APPSMITH_MONGODB_URI == *"localhost"* || $APPSMITH_MONGODB_URI == *"127.0.0.1"* ]]; then
    echo "Use local MongoDB"
    isLocalMongo=0
  fi
}
check_redis_uri() {
  echo "Check Redis uri host"
  isLocalRedis=1
  if [[ $APPSMITH_REDIS_URL == *"localhost"* || $APPSMITH_REDIS_URL == *"127.0.0.1"* ]]; then
    echo "Use local Redis"
    isLocalRedis=0
  fi
}

update_supervisord_mongodb_conf() {
  echo "Update supervisord MongoDB conf"
  if [ $isLocalMongo -eq 1 ]; then
    echo "Disable MongoDB supervisord"
    rm -f mongodb.conf
  else
    echo "Enable MongoDB supervisord"
    cp "$SUPERVISORD_CONF_PATH/mongodb.conf" /etc/supervisor/conf.d/
  fi
}

update_supervisord_redis_conf() {
  echo "Update supervisord Redis conf"
  if [ $isLocalRedis -eq 1 ]; then
    echo "Disable Redis supervisord"
    rm -f redis.conf
  else
    echo "Enable Redis supervisord"
    cp "$SUPERVISORD_CONF_PATH/redis.conf" /etc/supervisor/conf.d/
  fi
}

check_mongodb_uri
update_supervisord_mongodb_conf
check_redis_uri
update_supervisord_redis_conf
supervisorctl restart backend editor rts
supervisorctl update
