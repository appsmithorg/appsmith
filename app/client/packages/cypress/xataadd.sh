#!/bin/bash -x

curl --request POST --url 'https://yatin-s-workspace-jk8ru5.us-east-1.xata.sh/db/CypressKnownFailures:main/tables/CypressKnownFailuires/data?columns=id' --header "Authorization: Bearer $XATATOKEN" --header 'Content-Type: application/json' --data "{\"Spec\":\"$1\"}"
