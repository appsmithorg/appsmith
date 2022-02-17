#! /bin/sh

# This script is responsible for setting up the local Nginx server for running E2E Cypress tests 
# on our CI/CD system. Currently the script is geared towards Github Actions

# Serve the react bundle on a specific port. Nginx will proxy to this port
echo "Starting the setup the test framework"
sudo echo "127.0.0.1	dev.appsmith.com" | sudo tee -a /etc/hosts
serve -s build -p 3000 &

# Substitute all the env variables in nginx
vars_to_substitute=$(printf '\$%s,' $(env | grep -o "^APPSMITH_[A-Z0-9_]\+" | xargs))
cat ./docker/templates/nginx-app.conf.template | sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|http://localhost:3000|g" | sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|http://localhost:8080|g" | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx.conf
cat ./docker/templates/nginx-root.conf.template | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx-root.conf

# Create the SSL files for Nginx. Required for service workers to work properly.
touch ./docker/dev.appsmith.com.pem ./docker/dev.appsmith.com-key.pem
echo "$APPSMITH_SSL_CERTIFICATE" > ./docker/dev.appsmith.com.pem
echo "$APPSMITH_SSL_KEY" > ./docker/dev.appsmith.com-key.pem

echo "Going to run the nginx server"
sudo docker pull nginx:latest
sudo docker pull appsmith/test-event-driver:latest

sudo docker run --network host --name wildcard-nginx -d -p 80:80 -p 443:443 \
	-v `pwd`/docker/nginx-root.conf:/etc/nginx/nginx.conf \
    -v `pwd`/docker/nginx.conf:/etc/nginx/conf.d/app.conf \
    -v `pwd`/docker/dev.appsmith.com.pem:/etc/certificate/dev.appsmith.com.pem \
    -v `pwd`/docker/dev.appsmith.com-key.pem:/etc/certificate/dev.appsmith.com-key.pem \
    nginx:latest &
sudo mkdir -p git-server/keys
sudo mkdir -p git-server/repos

sudo docker run --name test-event-driver -d -p 2222:22 -p 5001:5001 -p 3306:3306 \
  -p 5432:5432 -p 28017:27017 -v ~/git-server/keys:/git-server/keys \
  -v ~/git-server/repos:/git-server/repos  appsmith/test-event-driver:latest

echo "Waiting for test event driver to start"
sleep 50

echo "Checking if the containers have started"
sudo docker ps -a
for fcid in $(sudo docker ps -a | awk '/Exited/ { print $1 }'); do
  echo "Logs for container '$fcid'."
  docker logs "$fcid"
done
if sudo docker ps -a | grep -q Exited; then
  echo "One or more containers failed to start." >&2
  exit 1
fi

echo "Checking if the server has started"
status_code=$(curl -o /dev/null -s -w "%{http_code}\n" https://dev.appsmith.com/api/v1/users)

retry_count=1

while [  "$retry_count" -le "3"  -a  "$status_code" -eq "502"  ]; do
	echo "Hit 502.Server not started retrying..."
	retry_count=$((1 + $retry_count))
	sleep 30
	status_code=$(curl -o /dev/null -s -w "%{http_code}\n" https://dev.appsmith.com/api/v1/users)
done

echo "Checking if client and server have started"
ps -ef |grep java 2>&1
ps -ef |grep  serve 2>&1

if [ "$status_code" -eq "502" ]; then
  echo "Unable to connect to server"
  exit 1
fi

# DEBUG=cypress:* $(npm bin)/cypress version
# sed -i -e "s|api_url:.*$|api_url: $CYPRESS_URL|g" /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
# cat /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
