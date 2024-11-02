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
    while [ $attempts -lt 3 ]; do
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
        # Extract severity level, CVE ID and format output correctly
        print $3","product_name",""SCOUT"","$2
    }
}' | sort -u > "$CSV_OUTPUT_FILE"

# Check if the CSV output file is empty
[ -s "$CSV_OUTPUT_FILE" ] || echo "No vulnerabilities found for image: $IMAGE" > "$CSV_OUTPUT_FILE"

# Compare new vulnerabilities against old vulnerabilities
echo "Comparing new vulnerabilities with existing vulnerabilities in $OLD_VULN_FILE..."
if [ -s "$OLD_VULN_FILE" ]; then
    awk -F, 'NR==FNR {seen[$1","$2","$3","$4]; next} !($1","$2","$3","$4 in seen)' "$OLD_VULN_FILE" "$CSV_OUTPUT_FILE" > "scout_vulnerabilities_diff.csv"
else
    echo "$OLD_VULN_FILE is empty. All new vulnerabilities will be included."
    cp "$CSV_OUTPUT_FILE" "scout_vulnerabilities_diff.csv"
fi

# Output for verification
echo "Fetching passed data..."
cat "$OLD_VULN_FILE"
echo ""
echo "Fetching new data..."
cat "$CSV_OUTPUT_FILE"
echo ""
echo "Fetching diff..."
cat "scout_vulnerabilities_diff.csv"
echo ""

# Insert new vulnerabilities into the PostgreSQL database using psql
insert_vulns_into_db() {
  local count=0
  local query_file="insert_vulns.sql"
  echo "BEGIN;" > "$query_file"  # Start the transaction

  while IFS=, read -r vurn_id product scanner_tool priority; do
    # Skip empty lines
    if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
      echo "Skipping empty vulnerability entry"
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

    # Check for existing product list in the database for this vulnerability ID
    existing_products=$(psql -t -c "SELECT product FROM vulnerability_tracking WHERE vurn_id = '$vurn_id' AND scanner_tool = '$scanner_tool'" "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" | xargs)

    # Concatenate new product with existing products if necessary
    if [[ -n "$existing_products" && "$existing_products" != *"$product"* ]]; then
      product="$existing_products, $product"
    fi

    # Insert the data and handle conflicts by updating specific fields on conflict
    echo "INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod) 
    VALUES ('$product', '$scanner_tool', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$update_date', '$comments', '$owner', '$pod')
    ON CONFLICT (scanner_tool, vurn_id) 
    DO UPDATE SET 
        product = '$product',
        priority = EXCLUDED.priority,
        pr_id = EXCLUDED.pr_id,
        pr_link = EXCLUDED.pr_link,
        github_run_id = EXCLUDED.github_run_id,
        update_date = EXCLUDED.update_date,
        comments = EXCLUDED.comments,
        owner = EXCLUDED.owner,
        pod = EXCLUDED.pod;" >> "$query_file"

    ((count++))
  done < "scout_vulnerabilities_diff.csv"

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
if [ -s "scout_vulnerabilities_diff.csv" ]; then
  insert_vulns_into_db
else
  echo "No new vulnerabilities to insert."
fi