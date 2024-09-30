#!/bin/bash

init_pg_db() {
  # Create the appsmith schema
  echo "Initializing PostgreSQL with schema..."

  # Check if APPSMITH_DB_URL is a PostgreSQL URL
  if [[ -n "$APPSMITH_DB_URL" && "$APPSMITH_DB_URL" == postgres*://* ]]; then
    echo "APPSMITH_DB_URL is a valid PostgreSQL URL."

    # Check if the DB_HOST is local (localhost or 127.0.0.1)
    if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" ]]; then
      echo "Local PostgreSQL detected, switching to postgres user."
      PGPASSWORD=$DB_PASSWORD su - postgres -c "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'CREATE SCHEMA IF NOT EXISTS appsmith;'"
    else
      echo "Remote PostgreSQL detected, running as current user."
      PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE SCHEMA IF NOT EXISTS appsmith;"
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

init_pg_db
