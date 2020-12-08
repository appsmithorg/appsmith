#!/bin/sh

APPSMITH_INSTALLATION_ID=$(curl -s 'https://api64.ipify.org')

curl -s --location --request POST 'https://hook.integromat.com/dkwb6i52am93pi30ojeboktvj32iw0fa' \
--header 'Content-Type: text/plain' \
--data-raw '{
  "userId": "'"$APPSMITH_INSTALLATION_ID"'",
  "event": "Installation Success",
  "data": {
      "platform": "heroku",
      "os": "Alpine"
   }
}'
