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

# Function to install Docker Scout
install_docker_scout() {
    echo "Installing Docker Scout..."
    local attempts=0
    while [ $attempts -lt 5 ]; do
        echo "Attempt $((attempts + 1))..."
        curl -fsSL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh -o install-scout.sh
        sh install-scout.sh &> install_scout_log.txt
        if [ $? -eq 0 ]; then
            echo "Docker Scout installed successfully."
            return 0
        fi
        echo "Attempt $((attempts + 1)) failed. Check install_scout_log.txt for details."
        ((attempts++))
        sleep 2
    done
    echo "Error: Docker Scout installation failed after $attempts attempts."
    exit 1
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Ensure Docker is running
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker..."
    sudo systemctl start docker
fi

# Check if Docker Scout is installed
if ! command -v scout &> /dev/null; then
    install_docker_scout
fi

# Prepare the output CSV file
CSV_OUTPUT_FILE="scout_vulnerabilities.csv"
rm -f "$CSV_OUTPUT_FILE"

# Extract the product name from the image name
case "$IMAGE" in
    *appsmith/appsmith-ce:*) product_name="CE" ;;
    *appsmith/appsmith-ee:*) product_name="EE" ;;
    *appsmith/cloud-services:*) product_name="CLOUD" ;;
    *) product_name="UNKNOWN" ;;
esac

# Fetch vulnerabilities and format the output correctly
docker scout cves "$IMAGE" | grep -E "✗ |CVE-" | awk -v product_name="$product_name" -F' ' '
{
    # Check for valid vulnerability data and format it correctly
    if ($2 != "" && $3 ~ /^CVE-/) {
        # Extract severity level, CVE ID, and format output correctly
        print $3","product_name",""SCOUT"","$2
    }
}' | sort -u > "$CSV_OUTPUT_FILE"

# Check if the CSV output file is empty
[ -s "$CSV_OUTPUT_FILE" ] || echo "No vulnerabilities found for image: $IMAGE" > "$CSV_OUTPUT_FILE"

# Insert new vulnerabilities into the PostgreSQL database using psql
insert_vulns_into_db() {
  local query_file="insert_vulns.sql"
  echo "BEGIN;" > "$query_file"

  while IFS=, read -r vurn_id product scanner_tool priority; do
    if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
      echo "Skipping empty vulnerability entry"
      continue
    fi

    local pr_id="${GITHUB_PR_ID:-}"
    local pr_link="${GITHUB_PR_LINK:-}"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local comments="Initial vulnerability report"
    local owner="John Doe"
    local pod="Security"

    # Clean up and trim spaces from input values
    vurn_id=$(echo "$vurn_id" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//')
    priority=$(echo "$priority" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//')
    product=$(echo "$product" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//' | tr -d '[:space:]')
    scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g" | sed 's/^[ \t]*//;s/[ \t]*$//' | tr -d '[:space:]')

    # Fetch existing values for this vulnerability ID
    existing_entry=$(psql -t -c "SELECT product, scanner_tool FROM vulnerability_tracking WHERE vurn_id = '$vurn_id'" "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" 2>/dev/null)
    
    # Process fetched data and merge unique values
    if [[ -z "$existing_entry" ]]; then
      combined_products="$product"
      combined_scanner_tools="$scanner_tool"
    else
      IFS='|' read -r existing_product existing_scanner_tool <<< "$existing_entry"
      combined_products=$(echo "$existing_product,$product" | tr ',' '\n' | sed '/^$/d' | sed 's/^[ \t]*//;s/[ \t]*$//' | sort -u | tr '\n' ',' | sed 's/^,//; s/,$//')
      combined_scanner_tools=$(echo "$existing_scanner_tool,$scanner_tool" | tr ',' '\n' | sed '/^$/d' | sed 's/^[ \t]*//;s/[ \t]*$//' | sort -u | tr '\n' ',' | sed 's/^,//; s/,$//')
    fi
    combined_products=$(echo "$combined_products" | tr -d '[:space:]')
    combined_scanner_tools=$(echo "$combined_scanner_tools" | tr -d '[:space:]')
    # Write the insert query to the SQL file
    echo "INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod) 
    VALUES ('$combined_products', '$combined_scanner_tools', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$created_date', '$comments', '$owner', '$pod')
    ON CONFLICT (vurn_id) 
    DO UPDATE SET 
        product = '$combined_products',
        scanner_tool = '$combined_scanner_tools',
        priority = EXCLUDED.priority,
        pr_id = EXCLUDED.pr_id,
        pr_link = EXCLUDED.pr_link,
        github_run_id = EXCLUDED.github_run_id,
        update_date = EXCLUDED.update_date,
        comments = EXCLUDED.comments,
        owner = EXCLUDED.owner,
        pod = EXCLUDED.pod;" >> "$query_file"

  done < "$CSV_OUTPUT_FILE"

  echo "COMMIT;" >> "$query_file"
  echo "Queries written to $query_file."

  # Execute the SQL file and rollback on failure
  if psql -e "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" -f "$query_file"; then
    echo "Vulnerabilities successfully inserted into the database."
  else
    echo "Error: Failed to insert vulnerabilities. Performing rollback."
    echo "ROLLBACK;" | psql "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME"
    exit 1
  fi
}

if [ -s "$CSV_OUTPUT_FILE" ]; then
  insert_vulns_into_db
else
  echo "No new vulnerabilities to insert."
fi