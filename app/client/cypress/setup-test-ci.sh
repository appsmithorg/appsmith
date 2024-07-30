#! /bin/sh

# This script is responsible for setting up the local Nginx server for running E2E Cypress tests
# on our CI/CD system. Currently the script is geared towards Github Actions

echo "Starting the setup for test framework"
sudo echo "127.0.0.1	localhost" | sudo tee -a /etc/hosts

sleep 10

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
status_code=$(curl -o /dev/null -s -w "%{http_code}\n" http://localhost/api/v1/users)

retry_count=1

while [  "$retry_count" -le "3"  -a  "$status_code" -eq "502"  ]; do
	echo "Hit 502.Server not started retrying..."
	retry_count=$((1 + $retry_count))
	sleep 30
	status_code=$(curl -o /dev/null -s -w "%{http_code}\n" http://localhost/api/v1/users)
done

echo "Checking if client and server have started"
ps -ef |grep java 2>&1
ps -ef |grep  serve 2>&1

echo "status code: $status_code"

if [ "$status_code" -eq "502" ]; then
  echo "Unable to connect to server"
  docker logs appsmith
  exit 1
fi

# DEBUG=cypress:* $(npm bin)/cypress version
# sed -i -e "s|api_url:.*$|api_url: $CYPRESS_URL|g" /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
# cat /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
