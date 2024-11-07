#!/bin/bash

# Check required environment variables
required_vars=("DB_HOST" "DB_NAME" "DB_USER" "DB_PWD")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ] || [[ "${!var}" == "your_${var,,}" ]]; then
    echo "Error: Required environment variable $var is missing or not set correctly."
    exit 1
  fi
done

DB_HOST="${DB_HOST}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PWD="${DB_PWD}"

# Assign the parameters from the workflow
IMAGE="$1"
GITHUB_PR_ID="$2"
GITHUB_PR_LINK="$3"
GITHUB_RUN_ID="$4"
OLD_VULN_FILE="${5:-vulnerability_base_data.csv}"

# Compare each vulnerability with the database and store new ones in a CSV file
compare_and_store_vulns() {
  local new_vulns_file="scout_new_vulnerabilities.csv"
  
  echo "vurn_id,product,scanner_tool,priority" > "$new_vulns_file"  # CSV header

  while IFS=, read -r vurn_id product scanner_tool priority; do
    if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
      echo "Skipping empty vulnerability entry"
      continue
    fi

    # Clean up and trim spaces from input values
    vurn_id=$(echo "$vurn_id" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//')
    priority=$(echo "$priority" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//')
    product=$(echo "$product" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//' | tr -d '[:space:]')
    scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//' | tr -d '[:space:]')

    # Check if vurn_id exists in the database
    existing_entry=$(psql -t -c "SELECT vurn_id FROM vulnerability_tracking WHERE vurn_id = '$vurn_id'" "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" 2>/dev/null)

    if [[ -z "$existing_entry" ]]; then
      # If vurn_id doesn't exist, store data in CSV file
      echo "$vurn_id,$product,$scanner_tool,$priority" >> "$new_vulns_file"
      echo "New vulnerability detected: $vurn_id"
    else
      echo "Skipping existing vulnerability: $vurn_id"
    fi

  done < "$CSV_OUTPUT_FILE"

  # Print the contents of new vulnerabilities
  if [ -s "$new_vulns_file" ]; then
    echo "****************************************************************"
    echo "New vulnerabilities stored in $new_vulns_file:"
    cat "$new_vulns_file"
    echo "****************************************************************"
  else
    echo "No new vulnerabilities to store."
  fi
}

# Check if there are vulnerabilities to process
if [ -s "$CSV_OUTPUT_FILE" ]; then
  compare_and_store_vulns
else
  echo "No vulnerabilities to process."
fi
