#! /bin/sh

# This script is responsible for setting up the local Nginx server for running E2E Cypress tests 
# on our CI/CD system. Currently the script is geared towards Github Actions

# Serve the react bundle on a specific port. Nginx will proxy to this port
echo "Starting the setup the test framework"
sudo echo "127.0.0.1	localhost" | sudo tee -a /etc/hosts
serve -s build -p 3000 &

# Substitute all the env variables in nginx
vars_to_substitute=$(printf '\$%s,' $(env | grep -o "^APPSMITH_[A-Z0-9_]\+" | xargs))
cat ./docker/templates/nginx-app.conf.template | sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|http://localhost:3000|g" | sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|http://localhost:8080|g" | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx.conf
cat ./docker/templates/nginx-root.conf.template | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx-root.conf

# Create the SSL files for Nginx. Required for service workers to work properly.
touch ./docker/localhost ./docker/localhost.pem
echo "$APPSMITH_SSL_CERTIFICATE" > ./docker/localhost.pem
echo "$APPSMITH_SSL_KEY" > ./docker/localhost.pem

echo "Going to run the nginx server"
#sudo docker pull nginx:latest
sudo docker pull postgres:latest

sudo docker run --network host --name postgres -d -p 5432:5432 \
 -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
 -v `pwd`/cypress/init-pg-dump-for-test.sql:/docker-entrypoint-initdb.d/init-pg-dump-for-test.sql \
 --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5 \
 postgres:latest &

sudo docker run -p 127.0.0.1:3306:3306  --name mariadb -e MARIADB_ROOT_PASSWORD=root123 -d mariadb

echo "Sleeping for 30 seconds to let the MySQL start"
sleep 30

sudo docker exec -i mariadb mysql -uroot -proot123 mysql <  `pwd`/cypress/init-mysql-dump-for-test.sql


echo "Sleeping for 30 seconds to let the servers start"
sleep 30

sudo docker run -d -p 127.0.0.1:28017:27017 --name Cypress-mongodb -e MONGO_INITDB_DATABASE=appsmith -v `pwd`/cypress/mongodb:/data/db mongo
echo "Sleeping for 30 seconds to let the servers start"
sleep 30

sudo docker cp `pwd`/cypress/sample_airbnb Cypress-mongodb:/sample_airbnb

sudo docker exec -i Cypress-mongodb /usr/bin/mongorestore --db sample_airbnb /sample_airbnb/sample_airbnb

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

if [ "$status_code" -eq "502" ]; then
  echo "Unable to connect to server"
  exit 1
fi

# DEBUG=cypress:* $(npm bin)/cypress version
# sed -i -e "s|api_url:.*$|api_url: $CYPRESS_URL|g" /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml
# cat /github/home/.cache/Cypress/4.1.0/Cypress/resources/app/packages/server/config/app.yml