#!/bin/bash

#Check required environment variables
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
GITHUB_PR_ID="$1"
GITHUB_PR_LINK="$2"
GITHUB_RUN_ID="$3"
IMAGE="${4:-appsmith/appsmith-ce:release}"
OLD_VULN_FILE="${5:-vulnerability_base_data.csv}"


# Function to install Trivy on macOS (both Apple Silicon and Intel)
install_trivy() {
    local count=0
    while [[ $count -lt 3 ]]; do
        echo "Installing Trivy (attempt $((count + 1)))..."
        
        # Run the installation script for Trivy
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.17.2
        
        # Check if Trivy is installed successfully
        if command -v trivy &> /dev/null; then
            echo "Trivy installed successfully."
            return 0
        fi
        
        echo "Installation failed. Retrying in 10 seconds..."
        sleep 10
        count=$((count + 1))
    done
    echo "Error: Trivy installation failed after 3 attempts."
    exit 1
}

# Check if Trivy is installed
[ -x "$(command -v trivy)" ] || install_trivy

IMAGE="${4:-appsmith/appsmith-ce:release}"
OLD_VULN_FILE="${5:-vulnerability_base_data.csv}"

NEW_VULN_FILE="trivy_vulnerabilities_new.csv"
DIFF_OUTPUT_FILE="trivy_vulnerabilities_diff.csv"

rm -f "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE"
touch "$OLD_VULN_FILE"

# Extract the product name from the image name
case "$IMAGE" in
    *appsmith/appsmith-ce:*) product_name="CE" ;;
    *appsmith/appsmith-ee:*) product_name="EE" ;;
    *appsmith/cloud-services:*) product_name="CLOUD" ;;
    *) product_name="UNKNOWN" ;;
esac

# Function to run Trivy scan
run_trivy_scan() {
    local count=0
    while [[ $count -lt 3 ]]; do
        echo "Running Trivy scan for image: $IMAGE (attempt $((count + 1)))..."
        
        # Run Trivy scan and capture both stdout and stderr
        trivy image --format json "$IMAGE" > "trivy_vulnerabilities.json" 2> "trivy_error.log"
        
        # Check if the scan was successful
        if [[ $? -eq 0 ]]; then
            echo "Scan completed successfully."
            return 0
        else
            echo "Scan failed. Check trivy_error.log for details."
            cat trivy_error.log
        fi
        
        echo "Retrying in 10 seconds..."
        sleep 10
        count=$((count + 1))
    done
    
    echo "Error: Trivy scan failed after 3 attempts."
    exit 1
}

run_trivy_scan

# Process vulnerabilities and generate the desired CSV format
if jq -e '.Results | length > 0' "trivy_vulnerabilities.json" > /dev/null; then
    jq -r --arg product "$product_name" '.Results[].Vulnerabilities[] | "\(.VulnerabilityID),\($product),TRIVY,\(.Severity)"' "trivy_vulnerabilities.json" | sed 's/^\s*//;s/\s*$//' | sort -u > "$NEW_VULN_FILE"
    echo "Vulnerabilities saved to $NEW_VULN_FILE"
else
    echo "No vulnerabilities found for image: $IMAGE"
    echo "No vulnerabilities found." > "$NEW_VULN_FILE"
fi

# Compare new vulnerabilities with the old file
if [ -s "$NEW_VULN_FILE" ]; then
    grep -Fvxf "$OLD_VULN_FILE" "$NEW_VULN_FILE" > "$DIFF_OUTPUT_FILE"
else
    echo "No new vulnerabilities found for image: $IMAGE"
fi

echo "Differences written to $DIFF_OUTPUT_FILE."
echo "New vulnerabilities saved to $NEW_VULN_FILE."

# Print the contents of the new vulnerabilities CSV
echo "Contents of $NEW_VULN_FILE:"
cat "$NEW_VULN_FILE"

# Cleanup JSON file
rm -f "trivy_vulnerabilities.json"

# Output for verification
echo "Fetching passed data..."
cat "$OLD_VULN_FILE"
echo ""
echo "Fetching new data..."
cat "$NEW_VULN_FILE"
echo ""
echo "Fetching diff..."
cat $DIFF_OUTPUT_FILE
echo ""

# Insert new vulnerabilities into the PostgreSQL database using psql
insert_vulns_into_db() {
  local count=0
  local query_file="insert_vulns.sql"
  echo "BEGIN;" > "$query_file"  # Start the transaction

  # Create an associative array to hold existing entries from the database
  declare -A existing_entries

  # Fetch existing vulnerabilities from the database to avoid duplicates
  psql -t -c "SELECT vurn_id, product, scanner_tool, priority FROM vulnerability_tracking WHERE scanner_tool = 'TRIVY'" "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" | while IFS='|' read -r db_vurn_id db_product db_scanner_tool db_priority; do
    existing_entries["$db_product,$db_scanner_tool,$db_vurn_id"]="$db_priority"
  done

  while IFS=, read -r vurn_id product scanner_tool priority; do
    # Skip empty lines
    if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
      echo "Skipping empty vulnerability entry"
      continue
    fi

    # Check if the entry already exists
    if [[ -n "${existing_entries["$product,$scanner_tool,$vurn_id"]}" ]]; then
      echo "Entry for $vurn_id already exists in the database. Skipping."
      continue
    fi

    local pr_id="$GITHUB_PR_ID"
    local pr_link="$GITHUB_PR_LINK"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local update_date="$created_date"
    local comments="Initial vulnerability report"
    local owner="John Doe"
    local pod="Security"

    # Escape single quotes in vulnerability ID, product, and priority
    vurn_id=$(echo "$vurn_id" | sed "s/'/''/g")
    priority=$(echo "$priority" | sed "s/'/''/g")
    product=$(echo "$product" | sed "s/'/''/g")
    scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g")

    # Write each insert query to the SQL file
    echo "INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod) VALUES ('$product', '$scanner_tool', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$update_date', '$comments', '$owner', '$pod');" >> "$query_file"
    
    ((count++))
  done < $DIFF_OUTPUT_FILE

  echo "COMMIT;" >> "$query_file"  # End the transaction
  echo "Queries written to $query_file."

  # Execute the SQL file
  psql -e "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" -f "$query_file"

  # Check if the execution was successful
  if [ $? -eq 0 ]; then
    echo "Vulnerabilities successfully inserted into the database."
  else
    echo "Error: Failed to insert vulnerabilities. Please check the database connection or query."
    exit 1
  fi
}

# Call the function to generate the insert queries and execute them
if [ -s $DIFF_OUTPUT_FILE ]; then
  insert_vulns_into_db
else
  echo "No new vulnerabilities to insert."
fi