#!/usr/bin/env bash

set -o errexit

psql -d postgres -c 'delete from "user_data" where id = (select id from "user" where email = '\''shrikant@appsmith.com'\'')'
psql -d postgres -c 'delete from "user" where email = '\''shrikant@appsmith.com'\'

curl -v --fail --silent --show-error \
          --header 'Origin: http://localhost' \
          --data-urlencode firstName="$(git config user.name | awk '{print $1}')" \
          --data-urlencode lastName="$(git config user.name | awk '{print $NF}')" \
          --data-urlencode name="$(git config user.name)" \
          --data-urlencode email="shrikant@appsmith.com" \
          --data-urlencode password="trapdoor" \
          --data-urlencode role="frontend+engineer" \
          --data-urlencode useCase="just+exploring" \
          --data-urlencode allowCollectingAnonymousData="false" \
          "localhost:8080/api/v1/users/super"
