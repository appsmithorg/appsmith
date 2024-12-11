#!/usr/bin/env bash

set -e

# Include the script to be tested
source /Users/appsmith/Work/appsmith-ce/deploy/docker/fs/opt/appsmith/pg-utils.sh

assert_equals() {
  if [ "$1" != "$2" ]; then
    echo "Assertion failed: expected '$2', but got '$1'"
    return 1
  fi
}

# Test extract_postgres_db_params function
test_extract_postgres_db_params_valid_db_string() {
  local conn_string="postgresql://user:password@localhost:5432/dbname"
  extract_postgres_db_params "$conn_string"

  if [ "$PG_DB_USER" != "user" ] || [ "$PG_DB_PASSWORD" != "password" ] || [ "$PG_DB_HOST" != "localhost" ] || [ "$PG_DB_PORT" != "5432" ] || [ "$PG_DB_NAME" != "dbname" ]; then
    echo "Test failed: test_extract_postgres_db_params_valid_db_string did not extract parameters correctly"
    echo_params
    exit 1
  fi

  echo "Test passed: ${FUNCNAME[0]}"
}

test_extract_postgres_db_params_empty_dbname() {
  local conn_string="postgresql://user:password@localhost:5432"
  extract_postgres_db_params "$conn_string"

  if [ "$PG_DB_USER" != "user" ] || [ "$PG_DB_PASSWORD" != "password" ] || [ "$PG_DB_HOST" != "localhost" ] || [ "$PG_DB_PORT" != "5432" ] || [ "$PG_DB_NAME" != "" ]; then
    echo "Test failed: test_extract_postgres_db_params_empty_dbname did not extract parameters correctly"
    echo_params
    exit 1
  fi

  echo "Test passed: ${FUNCNAME[0]}"
}

test_extract_postgres_db_params_with_spaces() {
  local conn_string="postgresql://user:p a s s w o r d@localhost:5432/db_name"
  extract_postgres_db_params "$conn_string"

  if [ "$PG_DB_USER" != "user" ] || [ "$PG_DB_PASSWORD" != "p%20a%20s%20s%20w%20o%20r%20d" ] || [ "$PG_DB_HOST" != "localhost" ] || [ "$PG_DB_PORT" != "5432" ] || [ "$PG_DB_NAME" != "db_name" ]; then
    echo "Test failed: test_extract_postgres_db_params_with_spaces did not extract parameters correctly"
    echo_params
    exit 1
  fi

  echo "Test passed: ${FUNCNAME[0]}"
}

test_get_unix_socket_directory() {
  local unix_socket_directory=$(get_unix_socket_directory)
  assert_equals $unix_socket_directory "/var/run/postgresql"
  echo "Test passed: ${FUNCNAME[0]}"
}

echo_params() {
  echo "PG_DB_USER: $PG_DB_USER"
  echo "PG_DB_PASSWORD: $PG_DB_PASSWORD"
  echo "PG_DB_HOST: $PG_DB_HOST"
  echo "PG_DB_PORT: $PG_DB_PORT"
  echo "PG_DB_NAME: $PG_DB_NAME"
}

# Run tests
test_extract_postgres_db_params_valid_db_string
test_extract_postgres_db_params_empty_dbname
test_extract_postgres_db_params_with_spaces
test_get_unix_socket_directory

echo "All Tests Pass!"