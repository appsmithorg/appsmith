#!/bin/bash
set -o errexit
# set -x

source ./composes.sh


# Function to update the APPSMITH_DB_URL in docker.env
# Once postgres is the default db, the APPSMITH_POSTGRES_DB_URL will be removed and this step won't be required anymore
# Check run-java.sh for more details why we need to update the APPSMITH_DB_URL to point to postgres
update_db_url() {
  docker exec "${container_name}" bash -c "sed -i 's|^APPSMITH_DB_URL=mongodb|# &|' /appsmith-stacks/configuration/docker.env"
  docker exec "${container_name}" bash -c "sed -i 's|^APPSMITH_POSTGRES_DB_URL=|APPSMITH_DB_URL=|' /appsmith-stacks/configuration/docker.env"
}

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

# Function to read the password from the PostgreSQL URL in docker.env.sh
get_appsmith_password() {
  local password
  password=$(docker exec "${container_name}" bash -c "grep -i 'APPSMITH_DB_URL' /appsmith-stacks/configuration/docker.env | sed -n 's/^.*\/\/appsmith:\([^@]*\)@.*$/\1/p'")
  printf "%s" "$password"
}

# Function to check the read access to databases
check_user_datasource_access_with_auth() {
  local password
  local appsmith_user_local_access
  local appsmith_user_remote_access
  password=$(get_appsmith_password)
  docker exec -i "${container_name}" bash -c "psql -h 127.0.0.1 -p 5432 -U appsmith -c '\l'" <<EOF
$password
EOF
  appsmith_user_remote_access=$?
  docker exec -i "${container_name}" bash -c "psql -p 5432 -U appsmith -c '\l'"
  appsmith_user_local_access=$?
  # Check if the Appsmith user does not have read access with local unix socket but has read access with local tcp socket
  if [[ $appsmith_user_local_access -ne 0 && $appsmith_user_remote_access -eq 0 ]]; then
    echo "appsmith user does not have read access to databases with local unix socket: ✅"
    echo "appsmith user has read access to databases with local tcp socket: ✅"
    local pg_user_local_access
    local pg_user_remote_access
    # Check if the postgres user has read access to databases with local unix socket
    docker exec -i "${container_name}" bash -c "psql -p 5432 -U postgres -d appsmith -c '\l'"
    pg_user_local_access=$?
    # Check if the postgres user does not have read access to databases with local tcp socket
    docker exec -i "${container_name}" bash -c "psql -h 127.0.0.1 -p 5432 -U postgres -d appsmith -c '\l'"
    pg_user_remote_access=$?
    if [[ $pg_user_local_access -eq 0 && $pg_user_remote_access -ne 0 ]]; then
        echo "postgres user has read access to databases with local unix socket: ✅"
        echo "postgres user does not have read access to databases with local tcp socket: ✅"
        return 0
    elif [[ $pg_user_local_access -ne 0 ]]; then
        echo "postgres user does not have read access to databases with local unix socket: ❌"
    elif [[ $pg_user_remote_access -eq 0 ]]; then
        echo "postgres user has read access to databases with local tcp socket: ❌"
    fi
  elif [[ $appsmith_user_local_access -eq 0 ]]; then
    echo "appsmith user has read access to databases with local unix socket: ❌"
  elif [[ $appsmith_user_remote_access -ne 0 ]]; then
    echo "appsmith user does not have read access to databases with local tcp socket: ❌"
  fi
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

# Test to check if the postgres auth is enabled after upgrading from 1.50 to local image
# Expectation:
# 1. Appsmith instance should be able to upgrade from v1.50 to local image
# 2. Postgres user should have read access to databases with local unix socket
# 3. Postgres user should not have read access to databases with tcp socket
# 4. Appsmith user should not have read access to databases with local unix socket
# 5. Appsmith user should have read access to databases with tcp socket
test_postgres_auth_enabled_upgrade_from_150tolocal() {
    # Steps:
    # 1. Start the Appsmith 1.50 instance
    # 2. Check if the Appsmith instance is up
    # 3. Check if the postgres user has read access to databases
    # 4. Update the APPSMITH_DB_URL in docker.env to point to postgres
    # 5. Start the Appsmith local image
    # 6. Check if the Appsmith instance is up
    # 7. Check if the Appsmith user has read access to databases
    # 8. Check if the postgres user has read access to databases
    echo "############################################################"
    echo "Starting ${FUNCNAME[0]}"

    cleanup
    # appsmith v1.50 does not have postgres auth enabled
    echo "Starting Appsmith 150"
    compose_appsmith_version v1.50
    # Wait until postgres to come up
    wait_for_postgres

    # Check if the Appsmith instance is up
    if is_appsmith_instance_ready; then

        # Check if the postgres user has read access to databases
        if check_user_datasource_access_with_host_port_wo_auth; then
            echo "postgres user has read access to databases: ✅"
        else
            # We don't expect the postgres user to not have read access as the auth level is set to trust hence failing the test after this step immediately
            echo "postgres user does not have read access to databases: ❌"
            exit 1
        fi
    else
        echo "Appsmith instance failed to start."
        exit 1
    fi

    # Update the APPSMITH_DB_URL in docker.env to point to postgres to initialise appsmith user and schema when the container with local image is started
    update_db_url
    echo "Remove container to reuse the same volume for local image"
    docker compose down --timeout 30 # wait upto timeout for graceful shutdown.
    # ensure the container exists before trying to remove it
    docker compose ps -q "${container_name}" && \
        docker compose rm -fsv "${container_name}" || \
        echo "Container "${container_name}" does not exist."

    echo "Starting Appsmith local to check the auth"
    compose_appsmith_local
    
    MAX_RETRIES=10
    RETRYSECONDS=5
    retry_count=0

    while true; do
        retry_count=$((retry_count + 1))
        if docker exec "${container_name}" pg_isready &&
          [ "$(docker exec "${container_name}" bash -c 'cat /appsmith-stacks/data/postgres/main/PG_VERSION')" = "14" ]; then
            break
        fi
        if [ $retry_count -le $MAX_RETRIES ]; then
            echo "Waiting for postgres to be up..."
            sleep $RETRYSECONDS
        else
            echo "Test ${FUNCNAME[0]} Failed"
            exit 1
        fi
    done
    
    # Check if the Appsmith instance is up
    if is_appsmith_instance_ready; then

        # Check if the Appsmith user has read access to databases
        if check_user_datasource_access_with_auth; then
            echo "Test ${FUNCNAME[0]} Passed ✅"
        else 
            echo "Test ${FUNCNAME[0]} Failed ❌"
            exit 1
        fi
    else
        echo "Appsmith instance failed to start."
        echo "Test ${FUNCNAME[0]} Failed ❌"
        exit 1
    fi
}

# Test to check if the postgres auth is enabled after restarting local image
# Expectation:
# 1. Appsmith instance should be able to start to local image with mongodb default uri
# 2. Appsmith instance should be able to restart to local image with postgres uri
# 3. Postgres user should have read access to databases with local unix socket
# 4. Postgres user should not have read access to databases with tcp socket
# 5. Appsmith user should not have read access to databases with local unix socket
# 6. Appsmith user should have read access to databases with tcp socket
test_postgres_auth_enabled_restart_localtolocal() {
    # Steps:
    # 1. Start the Appsmith local instance with mongodb default uri
    # 2. Check if the Appsmith instance is up
    # 3. Check if the postgres user has read access to databases
    # 4. Update the APPSMITH_DB_URL in docker.env to point to postgres
    # 5. Start the Appsmith local image
    # 6. Check if the Appsmith instance is up
    # 7. Check if the Appsmith user has read access to databases
    # 8. Check if the postgres user has read access to databases
    echo "############################################################"
    echo "Starting ${FUNCNAME[0]}"

    cleanup
    echo "Starting Appsmith local with mongodb default uri"
    compose_appsmith_local
    # Wait until postgres to come up
    wait_for_postgres

    # Check if the Appsmith instance is up
    if is_appsmith_instance_ready; then

        # Check if the postgres user has read access to databases
        if check_user_datasource_access_with_local_port_wo_auth; then
            echo "postgres user has read access to databases: ✅"
        else
            # We don't expect the postgres user to not have read access as the auth level is set to trust hence failing the test after this step immediately
            echo "postgres user does not have read access to databases: ❌"
            exit 1
        fi
    else
        echo "Appsmith instance failed to start."
        exit 1
    fi

    # Update the APPSMITH_DB_URL in docker.env to point to postgres to initialise appsmith user and schema when the container with local image is started
    update_db_url
    echo "Remove container to reuse the same volume for local image"
    docker compose down --timeout 30 # wait upto timeout for graceful shutdown.
    # ensure the container exists before trying to remove it
    docker compose ps -q "${container_name}" && \
        docker compose rm -fsv "${container_name}" || \
        echo "Container "${container_name}" does not exist."

    echo "Starting Appsmith local to check the auth"
    compose_appsmith_local

    wait_for_postgres

    # Check if the Appsmith instance is up
    if is_appsmith_instance_ready; then

        # Check if the Appsmith user has read access to databases
        if check_user_datasource_access_with_auth; then
            echo "Test ${FUNCNAME[0]} Passed ✅"
        else 
            echo "Test ${FUNCNAME[0]} Failed ❌"
            exit 1
        fi
    else
        echo "Appsmith instance failed to start."
        echo "Test ${FUNCNAME[0]} Failed ❌"
        exit 1
    fi
}

container_name="appsmith-docker-test"

test_postgres_auth_enabled_upgrade_from_150tolocal
test_postgres_auth_enabled_restart_localtolocal