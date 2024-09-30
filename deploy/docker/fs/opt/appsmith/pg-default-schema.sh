#!/bin/bash

run_pg_db() {
  # Create the appsmith schema
  echo "Initializing PostgreSQL with schema..."

  # Check if APPSMITH_DB_URL is a PostgreSQL URL
  if [[ -n "$APPSMITH_DB_URL" && "$APPSMITH_DB_URL" == postgres*://* ]]; then
    echo "APPSMITH_DB_URL is a valid PostgreSQL URL."

    PGPASSWORD=$DB_PASSWORD su - postgres -c "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'CREATE SCHEMA IF NOT EXISTS appsmith;'"

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

run_pg_db
