#!/bin/bash
endpoint="http://localhost/api/v1/health"
status_code=0

while [ $status_code -ne 200 ]; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    status_code=$response
    
    if [ $status_code -ne 200 ]; then
        echo "Response status code: $status_code. Retrying..."
        sleep 30
    fi
done
