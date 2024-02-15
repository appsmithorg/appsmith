#!/bin/bash

setup_temporal_server(){
  echo "Setting up Temporal Server ..."
  local temporal_cli=/opt/temporal/cli/bin/temporal
  local temporal_default_namespace=default
  local temporal_default_namespace_retention=2 # completed workflows will be deleted after these days

  until $temporal_cli operator cluster health | grep -q SERVING; do
      echo "Waiting for Temporal server to start..."
      sleep 1
  done
  echo "Temporal server started."

  # create default namespace if it doesn't exist
  if ! $temporal_cli operator namespace describe "${temporal_default_namespace}"; then
    echo "Temporal default namespace \"${temporal_default_namespace}\" not found. Creating..."
    $temporal_cli operator namespace create --retention "${temporal_default_namespace_retention}" --description "Default namespace for Temporal Server." "${temporal_default_namespace}"
  else
    echo "Temporal default namespace \"${temporal_default_namespace}\" already registered."
  fi


  # create search attributes if they were not created before
   until $temporal_cli operator search-attribute list --namespace "${temporal_default_namespace}"; do
      echo "Waiting for Temporal namespace cache to refresh..."
      sleep 1
    done
    echo "Temporal namespace cache refreshed."

    $temporal_cli operator search-attribute create --namespace "${temporal_default_namespace}" \
        --name appsmithWorkflowId --type Text
    echo "Temporal custom search attributes added."
}


setup_temporal_postgres(){

  echo "Setting up Temporal Postgres ..."
  local temporal_home="/opt/temporal"
  local temporal_src="${temporal_home}/temporal-1.22.4"
  local temporal_postgres_version_dir="v96"
  local temporal_dbname="appsmith"
  local temporal_schemaname="temporal"
  local temporal_visibility_schemaname="temporal_visibility"
  local db_port="5432"
  local postgres_endpoint="127.0.0.1"
  local temporal_dbuser="temporal"
  local temporal_db_plugin="postgres"

  # Create temporal user
  su postgres -c "/usr/lib/postgresql/13/bin/createuser -h /tmp/appsmith/pg-runtime ${temporal_dbuser} -s"

  # Create common appsmith database
  $temporal_home/temporal-sql-tool --plugin postgres --ep "${postgres_endpoint}" -u "${temporal_dbuser}" -p "${db_port}" --db "${temporal_dbname}"  create

  local common_params="--plugin ${temporal_db_plugin} --ep ${postgres_endpoint} -u ${temporal_dbuser} -p ${db_port} --db ${temporal_dbname}"

  # Create temporal and temporal_visibility databases
  SCHEMA_DIR="${temporal_src}/schema/postgresql/${temporal_postgres_version_dir}/temporal/versioned"
  psql -h /tmp/appsmith/pg-runtime -U "${temporal_dbuser}" -d "${temporal_dbname}" -c "CREATE SCHEMA ${temporal_schemaname};"
  $temporal_home/temporal-sql-tool ${common_params} --ca "search_path=${temporal_schemaname}" setup-schema -v 0.0
  $temporal_home/temporal-sql-tool ${common_params} --ca "search_path=${temporal_schemaname}" update-schema -d "${SCHEMA_DIR}"

  VISIBILITY_SCHEMA_DIR="${temporal_src}/schema/postgresql/${temporal_postgres_version_dir}/visibility/versioned"
  psql -h /tmp/appsmith/pg-runtime -U "${temporal_dbuser}" -d "${temporal_dbname}" -c "CREATE SCHEMA ${temporal_visibility_schemaname=};"
  $temporal_home/temporal-sql-tool ${common_params}  --ca "search_path=${temporal_visibility_schemaname}" setup-schema -v 0.0
  $temporal_home/temporal-sql-tool ${common_params}  --ca "search_path=${temporal_visibility_schemaname}" update-schema -d "${VISIBILITY_SCHEMA_DIR}"
}


# Check if temporal and temporal_visibility schemas exist in postgres. If not, create them.
appsmith_db_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'appsmith'")
temporal_schema_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_namespace WHERE nspname = 'temporal'")
temporal_visibility_schema_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_namespace WHERE nspname = 'temporal_visibility'")

if [ "$appsmith_db_exists" != "1" ] || [ "$temporal_schema_exists" != "1" ] || [ "$temporal_visibility_schema_exists" != "1" ]; then
    setup_temporal_postgres
fi


# Run this func in parallel process. It will wait for server to start and then run required steps.
setup_temporal_server &

exec /opt/temporal/temporal-server --env development-postgres start
