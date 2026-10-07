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

# Wait for the backend to be ready, not merely reachable. A 200 from this endpoint is
# what the image's own auto_heal.sh treats as "backend responsive", and it is the first
# request every Cypress signup intercepts. Anything else, including a connection
# refusal, means the first spec would start against a backend that is still booting.
readiness_url="http://localhost/api/v1/tenants/current"
timeout_seconds=300
poll_interval=10
deadline=$(( $(date +%s) + timeout_seconds ))
attempt=0
status_code=000

echo "Waiting up to ${timeout_seconds}s for the server to be ready at $readiness_url"
while :; do
  attempt=$((attempt + 1))
  status_code=$(curl -o /dev/null -s -m 10 -w "%{http_code}" "$readiness_url") || status_code=000
  if [ "$status_code" -eq 200 ]; then
    echo "Server is ready after $attempt attempt(s)"
    break
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    break
  fi
  echo "Server not ready (attempt $attempt, status $status_code). Retrying in ${poll_interval}s..."
  sleep "$poll_interval"
done

echo "Checking if client and server have started"
ps -ef | grep java 2>&1
ps -ef | grep serve 2>&1

if [ "$status_code" -ne 200 ]; then
  echo "Server did not become ready within ${timeout_seconds}s (last status: $status_code)" >&2
  docker logs appsmith
  exit 1
fi
