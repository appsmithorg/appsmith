#!/bin/bash

run_pg_db() {
  # Create the appsmith schema
  echo "Initializing PostgreSQL with schema..."

  # Check if APPSMITH_DB_URL is a PostgreSQL URL
  if [[ -n "$APPSMITH_DB_URL" && "$APPSMITH_DB_URL" == postgres*://* ]]; then
    echo "APPSMITH_DB_URL is a valid PostgreSQL URL."
    # Extract username, password, host, port, and database name from APPSMITH_DB_URL
    DB_USER=$(echo "$APPSMITH_DB_URL" | sed -n 's#.*://\([^:]*\):.*#\1#p')
    DB_PASSWORD=$(echo "$APPSMITH_DB_URL" | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')
    DB_HOST=$(echo "$APPSMITH_DB_URL" | sed -n 's#.*://[^@]*@\([^:]*\):.*#\1#p')
    DB_PORT=$(echo "$APPSMITH_DB_URL" | sed -n 's#.*://[^@]*@[^:]*:\([^/]*\)/.*#\1#p')
    DB_NAME=$(echo "$APPSMITH_DB_URL" | sed -n 's#.*://[^@]*@[^/]*/\([^?]*\).*#\1#p')

    # Set defaults for host, port, and database name if not set
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-appsmith}

    for i in {1..60}; do
      PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null
      if [ $? -eq 0 ]; then
        echo "PostgreSQL is available!"
        break
      else
        echo "PostgreSQL is unavailable - waiting..."
        sleep 10
      fi

      # If PostgreSQL isn't available after 30 attempts (60 seconds), exit with failure
      if [ $i -eq 30 ]; then
        echo "PostgreSQL is still unavailable after multiple attempts. Exiting..."
        exit 1
      fi
    done

    echo "Connecting to PostgreSQL at $DB_HOST:$DB_PORT with user $DB_USER"

    # Execute SQL to create the appsmith schema if it doesn't exist (single line)
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE SCHEMA IF NOT EXISTS appsmith;"

    # Check if the schema creation was successful
    if [ $? -eq 0 ]; then
      echo "Schema 'appsmith' created or already exists."
    else
      echo "Failed to create schema 'appsmith'."
      exit 1
    fi
    echo "PostgreSQL initialization completed."
  else
      echo "APPSMITH_DB_URL is either empty or not a PostgreSQL URL. Skipping PostgreSQL initialization."
    fi
}

run_pg_db
