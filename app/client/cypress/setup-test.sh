#! /bin/sh

# This script is responsible for setting up the local Nginx server for running E2E Cypress tests 
# on our CI/CD system. Currently the script is geared towards Github Actions

# Serve the react bundle on a specific port. Nginx will proxy to this port
echo "Starting the setup the test framework"
sudo echo "127.0.0.1	dev.appsmith.com" | sudo tee -a /etc/hosts
serve -s build -p 3000 &

# Substitute all the env variables in nginx
vars_to_substitute=$(printf '\$%s,' $(env | grep -o "^APPSMITH_[A-Z0-9_]\+" | xargs))
cat ./docker/templates/nginx-linux.conf.template | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx.conf

# Create the SSL files for Nginx. Required for service workers to work properly.
touch ./docker/dev.appsmith.com.pem ./docker/dev.appsmith.com-key.pem
echo "$APPSMITH_SSL_CERTIFICATE" > ./docker/dev.appsmith.com.pem
echo "$APPSMITH_SSL_KEY" > ./docker/dev.appsmith.com-key.pem

echo "Going to run the nginx server"
sudo docker run --network host --name wildcard-nginx -d -p 80:80 -p 443:443 \
    -v `pwd`/docker/nginx.conf:/etc/nginx/conf.d/app.conf \
    -v `pwd`/docker/dev.appsmith.com.pem:/etc/certificate/dev.appsmith.com.pem \
    -v `pwd`/docker/dev.appsmith.com-key.pem:/etc/certificate/dev.appsmith.com-key.pem \
    nginx:latest &

echo "Sleeping for 5 seconds to let the server start"
sleep 5

# Create the test user 
curl --request POST -v 'https://dev.appsmith.com/api/v1/users' \
--header 'Content-Type: application/json' \
--data-raw '{
	"name" : "'"$CYPRESS_USERNAME"'",
	"email" : "'"$CYPRESS_USERNAME"'",
	"source" : "FORM",
	"state" : "ACTIVATED",
	"isEnabled" : "true",
	"password": "'"$CYPRESS_PASSWORD"'"
}'

# DEBUG=cypress:* $(npm bin)/cypress version
# sed -i -e "s|api_url:.*$|api_url: $CYPRESS_URL|g" /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
# cat /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
