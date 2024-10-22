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

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    exit 1
fi
if ! systemctl is-active --quiet docker; then
    sudo systemctl start docker
fi

# Check if Docker Scout is installed, if not install it
if ! command -v scout &> /dev/null; then
    install_docker_scout
fi

# Prepare the output CSV file
CSV_OUTPUT_FILE="scout_vulnerabilities.csv"
rm -f "$CSV_OUTPUT_FILE"

# Run Docker Scout CVE scan
docker scout cves "$IMAGE" | grep -E "✗ |CVE-" | awk '{if ($2 != "" && $3 != "") print $2","$3}' | sort -u > "$CSV_OUTPUT_FILE"
[ -s "$CSV_OUTPUT_FILE" ] || echo "No vulnerabilities found for image: $IMAGE" > "$CSV_OUTPUT_FILE"

# Compare new vulnerabilities
if [ -s "$OLD_VULN_FILE" ]; then
    echo "Comparing new vulnerabilities with existing vulnerabilities..."
    comm -13 <(awk -F, '{print $2}' "$OLD_VULN_FILE" | sort) <(awk -F, '{print $2}' "$CSV_OUTPUT_FILE" | sort) > "scout_vulnerabilities_diff.csv"
else
    echo "$OLD_VULN_FILE is empty. All vulnerabilities are considered new."
    cp "$CSV_OUTPUT_FILE" "scout_vulnerabilities_diff.csv"
fi

# Debugging: Print contents of diff file
echo "New vulnerability diff:"
cat "scout_vulnerabilities_diff.csv"

# Insert new vulnerabilities into the database
# Function to insert new vulnerabilities into the PostgreSQL database
insert_vulns_into_db() {
  local insert_count=0  # Initialize the insert count

  while IFS=, read -r priority vurn_id; do
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

    # Additional data to be inserted
    local pr_id="$GITHUB_PR_ID"
    local pr_link="$GITHUB_PR_LINK"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local update_date="$created_date"
    local comments="Initial vulnerability report"
    local owner="John Doe"
    local pod="Security"

    # Insert the vulnerability into the database
    psql "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" <<EOF
INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod)
VALUES ('$product_code', 'scout', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$update_date', '$comments', '$owner', '$pod');
EOF
    # Increment the insert count
    insert_count=$((insert_count + 1))

    echo "Inserted new vulnerability: $vurn_id with priority: $priority"
  done < "scout_vulnerabilities_diff.csv"

  # Return the total number of inserted rows
  echo "Total new vulnerabilities inserted: $insert_count"
}

# Insert if there are new vulnerabilities
if [ -s "scout_vulnerabilities_diff.csv" ]; then
  insert_vulns_into_db
else
  echo "No new vulnerabilities to insert."
fi