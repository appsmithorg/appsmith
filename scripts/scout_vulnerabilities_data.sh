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
GITHUB_PR_ID="$1"
GITHUB_PR_LINK="$2"
GITHUB_RUN_ID="$3"
IMAGE="${4:-appsmith/appsmith-ce:release}"
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
docker scout cves "$IMAGE" | grep -E "✗ |CVE-" | awk '{if ($2 != "" && $3 != "") print $2","$3}' | sort -u > "$CSV_OUTPUT_FILE"
[ -s "$CSV_OUTPUT_FILE" ] || echo "No vulnerabilities found for image: $IMAGE" > "$CSV_OUTPUT_FILE"

# Compare new vulnerabilities against old vulnerabilities
echo "Comparing new vulnerabilities with existing vulnerabilities in $OLD_VULN_FILE..."
if [ -s "$OLD_VULN_FILE" ]; then
    comm -13 <(awk -F, '{print $2}' "$OLD_VULN_FILE" | sort) <(awk -F, '{print $2}' "$CSV_OUTPUT_FILE" | sort) > "scout_vulnerabilities_diff.csv"
else
    echo "$OLD_VULN_FILE is empty. All new vulnerabilities will be included."
    cp "$CSV_OUTPUT_FILE" "scout_vulnerabilities_diff.csv"
fi

echo "Starting scout new data..."
cat scout_vulnerabilities.csv

echo "Starting scout diff..."
cat scout_vulnerabilities_diff.csv

# Insert new vulnerabilities into the PostgreSQL database using psql
insert_vulns_into_db() {
  local count=0
  while IFS=, read -r vurn_id priority; do
    # Print the vurn_id and priority for debugging
    if [[ $count -lt 2 ]]; then
      echo "Iteration $((count + 1)):"
      echo "vurn ID: $vurn_id"
      echo "priority: $priority"
    fi

    # Skip empty lines
    if [[ -z "$vurn_id" || -z "$priority" ]]; then
      echo "Skipping empty vulnerability ID or priority"
      continue
    fi

    # Determine the product code based on the image name
    local product_code
    case "$IMAGE" in
      *appsmith-ce*) product_code="CE" ;;
      *appsmith-ee*) product_code="EE" ;;
      *cloud-services*) product_code="CLOUD" ;;
      *) product_code="UNKNOWN" ;;
    esac

    local pr_id="$GITHUB_PR_ID"
    local pr_link="$GITHUB_PR_LINK"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local update_date="$created_date"
    local comments="Initial vulnerability report"
    local owner="John Doe"
    local pod="Security"

    ((count++))

    # Insert the vulnerability into the database and continue on failure
    psql "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" <<EOF
INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod)
VALUES ('$product_code', 'scout', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$update_date', '$comments', '$owner', '$pod');
EOF

    if [ $? -eq 0 ]; then
      echo "Inserted new vulnerability: $vurn_id with priority: $priority"
    else
      echo "Failed to insert vulnerability: $vurn_id with priority: $priority. Continuing..."
    fi

  done < "scout_vulnerabilities_diff.csv"
}

# Call the function to insert new vulnerabilities into the database
if [ -s "scout_vulnerabilities_diff.csv" ]; then
  insert_vulns_into_db
  echo "New vulnerabilities inserted into the database."
else
  echo "No new vulnerabilities to insert."
fi