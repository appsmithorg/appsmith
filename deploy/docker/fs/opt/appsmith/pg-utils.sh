#!/bin/bash

# default values
DB_USER="appsmith"
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_SCHEMA="appsmith"
DB_NAME="appsmith"
postgres_admin_user="postgres"

waitForPostgresAvailability() {
  if [ -z "$PG_DB_HOST" ]; then
    tlog "PostgreSQL host name is empty. Check env variables. Error. Exiting java setup"
    exit 2
  else

    MAX_RETRIES=50
    RETRYSECONDS=10
    retry_count=0
    while true; do
      su postgres -c "pg_isready -h '${PG_DB_HOST}' -p '${PG_DB_PORT}'"
      status=$?

      case $status in
      0)
        tlog "PostgreSQL host '$PG_DB_HOST' is ready."
        break
        ;;
      1)
        tlog "PostgreSQL host '$PG_DB_HOST' is rejecting connections e.g. due to being in recovery mode or not accepting connections eg. connections maxed out."
        ;;
      2)
        tlog "PostgreSQL host '$PG_DB_HOST' is not responding or running."
        ;;
      3)
        tlog "The connection check failed e.g. due to network issues or incorrect parameters."
        ;;
      *)
        tlog "pg_isready exited with unexpected status code: $status"
        break
        ;;
      esac

      retry_count=$((retry_count + 1))
      if [ $retry_count -le $MAX_RETRIES ]; then
        tlog "PostgreSQL connection failed. Retrying attempt $retry_count/$MAX_RETRIES in $RETRYSECONDS seconds..."
        sleep $RETRYSECONDS
      else
        tlog "Exceeded maximum retry attempts ($MAX_RETRIES). Exiting."
        # use exit code 2 to indicate that the script failed to connect to postgres and supervisor conf is set not to restart the program for 2.
        exit 2
      fi

    done
  fi
}

# for PostgreSQL, we use APPSMITH_DB_URL=postgresql://username:password@postgresserver:5432/dbname
# Args:
#     conn_string (string): PostgreSQL connection string
# Returns:
#     None
# Example:
#     postgres syntax
#       "postgresql://user:password@localhost:5432/appsmith"
#       "postgresql://user:password@localhost/appsmith"
#       "postgresql://user@localhost:5432/appsmith"
#       "postgresql://user@localhost/appsmith"
extract_postgres_db_params() {
  local conn_string=$1

  # Use node to parse the URI and extract components
  IFS=' ' read -r USER PASSWORD HOST PORT DB <<<"$(node -e "
    const connectionString = process.argv[1];
    const pgUri = connectionString.startsWith(\"postgresql://\")
      ? connectionString
      : 'http://' + connectionString; //Prepend a fake scheme for URL parsing
    const url = require('url');
    const parsedUrl = new url.URL(pgUri);

    // Extract the pathname and remove the leading '/'
    const db = parsedUrl.pathname.substring(1);

    // Default the port to 5432 if it's empty
    const port = parsedUrl.port || '5432';

    console.log(\`\${parsedUrl.username || '-'} \${parsedUrl.password || '-'} \${parsedUrl.hostname} \${port} \${db}\`);
  " "$conn_string")"

  # Now, set the environment variables
  export PG_DB_USER="$USER"
  export PG_DB_PASSWORD="$PASSWORD"
  export PG_DB_HOST="$HOST"
  export PG_DB_PORT="$PORT"
  export PG_DB_NAME="$DB"
}

init_pg_db() {
  # Create the appsmith schema
  echo "Initializing PostgreSQL with schema..."

  # Check if APPSMITH_DB_URL is a PostgreSQL URL
  if [[ -n "$APPSMITH_DB_URL" && "$APPSMITH_DB_URL" == postgres*://* ]]; then
    echo "APPSMITH_DB_URL is a valid PostgreSQL URL."

    # Check if the DB_HOST is local (localhost or 127.0.0.1)
    if [[ "$PG_DB_HOST" == "localhost" || "$PG_DB_HOST" == "127.0.0.1" ]]; then

      # Check if the database exists
      DB_CHECK=$(psql -h "$PG_DB_HOST" -p "$PG_DB_PORT" -U postgres -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$PG_DB_NAME'")

      if [ "$DB_CHECK" != "1" ]; then
        echo "Database $PG_DB_NAME does not exist. Creating database..."
        psql -h "$PG_DB_HOST" -p "$PG_DB_PORT" -U postgres -d "postgres" -c "CREATE DATABASE $PG_DB_NAME;"
      else
        echo "Database $PG_DB_NAME already exists."
      fi

      # Check if the schema exists
      SCHEMA_CHECK=$(psql -h "$PG_DB_HOST" -p "$PG_DB_PORT" -U postgres -d "$PG_DB_NAME" -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name='appsmith'")

      # Create schema and user if not exists
      if [ "$SCHEMA_CHECK" != "1" ]; then
        echo "Creating user '$PG_DB_USER' with password "
        psql -h "$PG_DB_HOST" -p "$PG_DB_PORT" -U postgres -d "$PG_DB_NAME" -c "CREATE USER \"$PG_DB_USER\" WITH PASSWORD '$PG_DB_PASSWORD';"

        echo "Schema 'appsmith' does not exist. Creating schema..."
        psql -h "$PG_DB_HOST" -p "$PG_DB_PORT" -U postgres -d "$PG_DB_NAME" -c "CREATE SCHEMA appsmith;"
      fi

      USER=$PG_DB_USER SCHEMA="appsmith" DB=$PG_DB_NAME HOST=$PG_DB_HOST PORT=$PG_DB_PORT grant_permissions_for_schema
    else
      echo "Remote PostgreSQL detected, running as current user."
      PGPASSWORD=$PG_DB_PASSWORD psql -h "$PG_DB_HOST" -p "$PG_DB_PORT" -U "$PG_DB_USER" -d "$PG_DB_NAME" -c "CREATE SCHEMA IF NOT EXISTS appsmith;"
    fi

    # Check if the schema creation was successful
    if [ $? -eq 0 ]; then
      echo "Schema 'appsmith' created or already exists."
    else
      echo "Failed to create schema 'appsmith'."
      exit 1
    fi
    echo "PostgreSQL initialization completed."
  fi
}

# Utility function to grant permissions to a user on a schema in a database on a host and port in PostgreSQL database
# Args:
#     USER (string): User to grant permissions to
#     SCHEMA (string): Schema to grant permissions on
#     DB (string): Database to grant permissions on
#     HOST (string): Host to grant permissions on
#     PORT (int): Port to grant permissions on
# Returns:
#     None
# Example:
#     USER="user" SCHEMA="schema" DB="db" HOST="host" PORT="port" grant_permissions_for_schema
grant_permissions_for_schema() {
  local user=${USER-$DB_USER} schema=${SCHEMA-$DB_SCHEMA} db=${DB-$DB_NAME} host=${HOST-$DB_HOST} port=${PORT-$DB_PORT}
  tlog "Granting permissions to user '${user}' on schema '$schema' in database '$db' on host '$host' and port '$port'..."
  psql -h ${host} -p ${port} -U ${postgres_admin_user} -d ${db} -c "GRANT ALL PRIVILEGES ON SCHEMA ${schema} TO ${user};"
  psql -h ${host} -p ${port} -U ${postgres_admin_user} -d ${db} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO ${user};"
  psql -h ${host} -p ${port} -U ${postgres_admin_user} -d ${db} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL PRIVILEGES ON TABLES TO ${user};"
  psql -h ${host} -p ${port} -U ${postgres_admin_user} -d ${db} -c "GRANT CONNECT ON DATABASE ${db} TO ${user};"
}

# Example usage of the functions
# waitForPostgresAvailability
# extract_postgres_db_params "postgresql://user:password@localhost:5432/dbname"
# init_pg_db
# USER="user" SCHEMA="schema" DB="db" HOST="host" PORT="port" grant_permissions_for_schema
