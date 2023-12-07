#!/usr/bin/env bash

set -e

set -o xtrace

sleep 120

while true;
do
        ### Get backend state
        echo "auto heal check"
        appsmith_status="$(curl --write-out %{http_code} --silent --output /dev/null localhost:80/api/v1/tenants/current)"
        echo "TIMESTAMP=`date "+%Y-%m-%d %H:%M:%S"` backend response "$appsmith_status
        if [[ "$appsmith_status" -ne 200 ]];
        then
                echo "TIMESTAMP=`date "+%Y-%m-%d %H:%M:%S"` backend is unresponsive";
                supervisorctl restart backend || echo true
        else
                echo "TIMESTAMP=`date "+%Y-%m-%d %H:%M:%S"` backend is responsive";
        fi
        sleep 10
done
