#!/bin/bash

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
  IFS=' ' read -r USER PASSWORD HOST PORT DB <<<$(node -e "
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
  " "$conn_string")

  # Now, set the environment variables
  export PG_DB_USER="$USER"
  export PG_DB_PASSWORD="$PASSWORD"
  export PG_DB_HOST="$HOST"
  export PG_DB_PORT="$PORT"
  export PG_DB_NAME="$DB"
}

# Example usage of the functions
# waitForPostgresAvailability
# extract_postgres_db_params "postgresql://user:password@localhost:5432/dbname"