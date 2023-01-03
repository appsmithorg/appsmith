#!/bin/bash -x

idlist=$(curl --request POST --url https://yatin-s-workspace-jk8ru5.us-east-1.xata.sh/db/CypressKnownFailures:main/tables/CypressKnownFailuires/query --header "Authorization: Bearer $XATATOKEN" --header 'Content-Type: application/json'|jq -r  ".[] | .[] |  select(.Spec==\"$1\") | .id")

while IFS= read -r line; do
    echo "... $line ..."
	curl --request DELETE --url "https://yatin-s-workspace-jk8ru5.us-east-1.xata.sh/db/CypressKnownFailures:main/tables/CypressKnownFailuires/data/$line?columns=id" --header "Authorization: Bearer $XATATOKEN"
	
done <<< "$idlist"
