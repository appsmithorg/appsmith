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

# Define the maximum number of retries for installing Docker Scout
MAX_RETRIES=3

# Function to install Docker Scout
install_docker_scout() {
    echo "Installing Docker Scout..."
    local attempts=0

    while [ $attempts -lt $MAX_RETRIES ]; do
        echo "Attempt $((attempts + 1))..."
        curl -fsSL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh -o install-scout.sh
        
        # Run the install script and capture output
        sh install-scout.sh &> install_scout_log.txt
        
        if [ $? -eq 0 ]; then
            echo "Docker Scout installed successfully."
            return 0  # Successful installation
        fi

        echo "Attempt $((attempts + 1)) failed. Check install_scout_log.txt for details."
        ((attempts++))
        sleep 2  # Wait before retrying
    done

    echo "Error: Docker Scout installation failed after $attempts attempts."
    echo "Check install_scout_log.txt for more details."
    exit 1
}

# Check if Docker is installed and the daemon is running
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Ensure Docker is running
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker..."
    sudo systemctl start docker
fi

# Check if Docker Scout is installed, if not, install it
if ! command -v scout &> /dev/null; then
    install_docker_scout
fi

# Prepare output files
NEW_VULN_FILE="scout_vulnerabilities_new.txt"
DIFF_OUTPUT_FILE="scout_vulnerabilities_diff.txt"
JSON_OUTPUT_FILE="scout_vulnerabilities.json"
rm -f "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE" "$JSON_OUTPUT_FILE"

# Run Docker Scout CVE scan
docker scout cves "$IMAGE" | grep -E "✗ |CVE-" | awk '{print $2, $3}' | sort -u > "$NEW_VULN_FILE"
[ -s "$NEW_VULN_FILE" ] || echo "No vulnerabilities found for image: $IMAGE" > "$NEW_VULN_FILE"

# Compare new vulnerabilities against old vulnerabilities
echo "Comparing new vulnerabilities with existing vulnerabilities in $OLD_VULN_FILE..."
comm -13 <(awk '{print $2}' "$OLD_VULN_FILE" | sort) <(awk '{print $2}' "$NEW_VULN_FILE" | sort) > "$DIFF_OUTPUT_FILE"

# Insert new vulnerabilities into the PostgreSQL database using psql
insert_vulns_into_db() {
  while IFS= read -r line; do
    # Extract priority and vurn_id from the line
    local priority=$(echo "$line" | awk '{print $1}')
    local vurn_id=$(echo "$line" | awk '{print $2}')

    # Determine the product code based on the image name
    local product_code
    case "$IMAGE" in
      *appsmith-ce*) product_code="CE" ;;
      *appsmith-ee*) product_code="EE" ;;
      *cloud-services*) product_code="CLOUD" ;;
      *) product_code="UNKNOWN" ;;
    esac

    # Additional data to be inserted
    local pr_id="$GITHUB_PR_ID"
    local pr_link="$GITHUB_PR_LINK"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local update_date="$created_date"
    local comments="Initial vulnerability report"  # Customize this as needed
    local owner="John Doe"  # Customize this as needed
    local pod="Security"  # Customize this as needed

    # Insert the vulnerability into the database
    psql "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" <<EOF
INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod)
VALUES ('$product_code', 'scout', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$update_date', '$comments', '$owner', '$pod');
EOF
    echo "Inserted new vulnerability: $vurn_id with priority: $priority"
  done < "$DIFF_OUTPUT_FILE"
}

# Call the function to insert new vulnerabilities into the database if there are any
if [ -s "$DIFF_OUTPUT_FILE" ]; then
  insert_vulns_into_db
  echo "New vulnerabilities inserted into the database."
else
  echo "No new vulnerabilities to insert."
fi