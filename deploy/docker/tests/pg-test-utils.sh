# Function to check if the Appsmith instance is up
is_appsmith_instance_ready() {
  local max_retries=200
  local retry_count=0
  local response_code

  while [ $retry_count -lt $max_retries ]; do
    response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
    if [[ $response_code -eq 200 ]]; then
      echo "Appsmith instance is ready."
      return 0
    fi
    echo "Waiting for Appsmith instance to be ready... (Attempt: $((retry_count + 1)))"
    retry_count=$((retry_count + 1))
    sleep 2
  done
  return 1
}

# Function to wait until the postgres is ready
wait_for_postgres() {
  local max_retries=200
  local retry_count=0

  while [ $retry_count -lt $max_retries ]; do
    if docker exec "${container_name}" pg_isready; then
      echo "Postgres is ready."
      return 0
    fi
    echo "Waiting for Postgres to be ready... (Attempt: $((retry_count + 1)))"
    retry_count=$((retry_count + 1))
    sleep 2
  done
}

# Function to check if the user exists in the database
check_user_exists() {
  local user
  user=$1
  local max_retries=200
  local retry_count=0
  while [ $retry_count -lt $max_retries ]; do
    if docker exec "${container_name}" bash -c "psql -p 5432 -U postgres -c \"SELECT 1 FROM pg_roles WHERE rolname='$user';\" | grep -q 1"; then
      echo "$user user exists."
      return 0
    fi
    echo "Waiting for $user user to be created... (Attempt: $((retry_count + 1)))"
    retry_count=$((retry_count + 1))
    sleep 1
  done
  echo "$user user does not exist."
  return 1
}

# Function to check if the Appsmith user has read access to databases
check_user_datasource_access_with_host_port_wo_auth() {
  docker exec "${container_name}" bash -c "psql -h 127.0.0.1 -p 5432 -U postgres -c '\l'"
  return $?
}

# Function to check if the Appsmith user has read access to databases
check_user_datasource_access_with_local_port_wo_auth() {
  docker exec "${container_name}" bash -c "psql -p 5432 -U postgres -c '\l'"
  return $?
}