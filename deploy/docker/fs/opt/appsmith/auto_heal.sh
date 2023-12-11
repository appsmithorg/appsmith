#!/usr/bin/env bash

set -e

set -o xtrace

sleep 120

echo "time out argument is "
echo $1

default_timeout="5"

# Check if the first command-line argument is provided
if [ -z "$1" ]; then
    # If not provided, assign a default value
    timeout=$default_timeout
else
    # If provided, use the provided value
    timeout="$1"
fi

echo "The timeout is: $timeout"

while true;
do
        ### Get backend state
        echo "auto heal check"
        appsmith_status="$(curl --max-time $timeout --write-out %{http_code} --silent --output /dev/null localhost:8080/api/v1/tenants/current || echo 1)"
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
