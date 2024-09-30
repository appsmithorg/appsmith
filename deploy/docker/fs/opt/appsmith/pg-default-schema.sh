#!/bin/bash

init_pg_db() {
  # Create the appsmith schema
  echo "Initializing PostgreSQL with schema..."

  # Check if APPSMITH_DB_URL is a PostgreSQL URL
  if [[ -n "$APPSMITH_DB_URL" && "$APPSMITH_DB_URL" == postgres*://* ]]; then
    echo "APPSMITH_DB_URL is a valid PostgreSQL URL."

    # Check if the DB_HOST is local (localhost or 127.0.0.1)
    if [[ "$PG_DB_HOST" == "localhost" || "$PG_DB_HOST" == "127.0.0.1" ]]; then
      echo "Local PostgreSQL detected."
      su - postgres -c "psql -c \"CREATE USER $PG_DB_USER WITH PASSWORD '$PG_DB_PASSWORD';\""
      echo "User '$PG_DB_USER' created or already exists."
      su - postgres -c "psql -h $PG_DB_HOST -p $PG_DB_PORT -d $PG_DB_NAME -c 'CREATE SCHEMA IF NOT EXISTS appsmith;'"
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

init_pg_db
