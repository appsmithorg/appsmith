#!/usr/bin/env bash

set -e
set -o xtrace

ENV_PATH="/appsmith-stacks/configuration/docker.env"
SUPERVISORD_CONF_PATH="/opt/appsmith/templates/supervisord"
echo 'Load environment configuration'
. "$ENV_PATH"

is-local-uri() {
  local uri="$1"
  [[ $uri == *"localhost"* || $uri == *"127.0.0.1"* ]]
}

apply-mongodb-change() {
  echo "Update supervisord MongoDB conf"
  if is-local-uri "$APPSMITH_MONGODB_URI"; then
    echo "Enable MongoDB supervisord"
    cp "$SUPERVISORD_CONF_PATH/mongodb.conf" /etc/supervisor/conf.d/
    mongodb_change=enabled
  elif [[ -f /etc/supervisor/conf.d/mongodb.conf ]]; then
    echo "Disable MongoDB supervisord"
    rm -v /etc/supervisor/conf.d/mongodb.conf
    mongodb_change=disabled
  fi
  mongodb_change=none
}

apply-redis-change() {
  echo "Update supervisord Redis conf"
  if is-local-uri "$APPSMITH_REDIS_URL"; then
    echo "Enable Redis supervisord"
    cp "$SUPERVISORD_CONF_PATH/redis.conf" /etc/supervisor/conf.d/
    redis_change=enabled
  elif [[ -f /etc/supervisor/conf.d/redis.conf ]]; then
    echo "Disable Redis supervisord"
    rm -v /etc/supervisor/conf.d/redis.conf
    redis_change=disabled
  fi
  redis_change=none
}

apply-mongodb-change
apply-redis-change

# When enabling local MongoDB, `update mongodb` should happen _before_ restarting backend, so that the local MongoDB is
# ready for the backend to connect to. But when disabling local MongoDB, `update mongodb` should happen _after_
# restarting backend, so that supervisor doesn't kill the DB while the backend is still connected to it.
# Same logic applies for Redis.

if [[ $mongodb_change == enabled ]]; then
  supervisorctl update mongodb
fi

if [[ $redis_change == enabled ]]; then
  supervisorctl update redis
fi

supervisorctl restart backend editor rts

if [[ $mongodb_change == disabled ]]; then
  supervisorctl update mongodb
fi

if [[ $redis_change == disabled ]]; then
  supervisorctl update redis
fi
