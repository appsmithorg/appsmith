#! /bin/sh

# This script is responsible for setting up the local Nginx server for running E2E Cypress tests
# on our CI/CD system. Currently the script is geared towards Github Actions

echo "Starting the setup for test framework"
sudo echo "127.0.0.1	localhost" | sudo tee -a /etc/hosts

sleep 10

appsmith_status() {
  docker inspect --format '{{.State.Status}}' appsmith 2>/dev/null || echo unknown
}

# The embedded MongoDB log lives on the stacks volume and no artifact captures it, so
# print its tail along with the container logs whenever the appsmith container dies.
print_appsmith_exit_logs() {
  echo "The appsmith container exited $1. Container logs:"
  docker logs appsmith
  mongo_log="$stacks_dir/data/mongodb/log"
  if [ -n "$stacks_dir" ] && sudo test -f "$mongo_log"; then
    echo "Last 100 lines of the embedded MongoDB log:"
    sudo tail -n 100 "$mongo_log"
  fi
}

stacks_dir=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/appsmith-stacks"}}{{.Source}}{{end}}{{end}}' appsmith 2>/dev/null)
appsmith_restarted=0

# The appsmith container's first boot initializes the embedded MongoDB with two mongod
# forks, and the second fork occasionally exits 1, which takes the container down before
# any spec runs. Restart it once from an empty data directory. The entrypoint skips the
# first-boot init (user, replica set) whenever data files exist, so restarting on the
# half-initialized directory would never become ready. Prints the exit logs on every call
# and returns 1 when the single restart is already used or the stacks directory is unknown.
restart_appsmith_once() {
  print_appsmith_exit_logs "$1"
  if [ "$appsmith_restarted" -ne 0 ] || [ -z "$stacks_dir" ]; then
    return 1
  fi
  appsmith_restarted=1
  echo "Removing $stacks_dir/data/mongodb and restarting the appsmith container once"
  sudo rm -rf "$stacks_dir/data/mongodb"
  docker start appsmith
}

if [ "$(appsmith_status)" = "exited" ]; then
  restart_appsmith_once "during startup" || true
fi

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
  if [ "$(appsmith_status)" = "exited" ]; then
    restart_appsmith_once "during the readiness wait" || break
    deadline=$(( $(date +%s) + timeout_seconds ))
    echo "Waiting up to ${timeout_seconds}s for the restarted container"
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
  if [ "$(appsmith_status)" = "exited" ]; then
    echo "The appsmith container is exited; its logs are above." >&2
  else
    echo "Server did not become ready within ${timeout_seconds}s (last status: $status_code)" >&2
    docker logs appsmith
  fi
  exit 1
fi
