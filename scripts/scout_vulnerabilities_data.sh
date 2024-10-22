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
touch "$OLD_VULN_FILE"

# Run Docker Scout CVE scan
docker scout cves "$IMAGE" | grep -E "✗ |CVE-" | awk '{print $2, $3}' | sort -u > "$NEW_VULN_FILE"
[ -s "$NEW_VULN_FILE" ] || echo "No vulnerabilities found for image: $IMAGE" > "$NEW_VULN_FILE"

# Categorize vulnerabilities
declare -A categories=( ["LOW"]=() ["MEDIUM"]=() ["HIGH"]=() ["CRITICAL"]=() ["UNSPECIFIED"]=() )
while IFS= read -r line; do
    for category in "${!categories[@]}"; do
        [[ "$line" =~ $category ]] && categories[$category]+=$(echo "$line" | awk '{print $2}')
    done
done < <(grep -Fvxf "$OLD_VULN_FILE" "$NEW_VULN_FILE")

# Output categorized results
{
    echo "Vulnerabilities introduced in $NEW_VULN_FILE but not in $OLD_VULN_FILE:"
    for category in "${!categories[@]}"; do
        if [[ -n "${categories[$category]}" ]]; then
            echo "Category: $category"
            printf '%s\n' ${categories[$category]}
        else
            echo "No new vulnerabilities in category: $category"
        fi
    done
} > "$DIFF_OUTPUT_FILE"

# Insert new vulnerabilities into the PostgreSQL database using psql
insert_vulns_into_db() {
  while IFS= read -r line; do
    local scanner_tool="scout"
    local vurn_id=$(echo "$line" | awk '{print $1}')
    local priority=$(echo "$line" | awk '{print $2}')
    
    # Determine the product code based on the image name
    local product_code
    case "$IMAGE" in
      *appsmith-ce*) product_code="CE" ;;
      *appsmith-ee*) product_code="EE" ;;
      *cloud-services*) product_code="CLOUD" ;;
      *) product_code="UNKNOWN" ;;
    esac

    # Insert the vulnerability into the database
    psql "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" <<EOF
INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date)
VALUES ('$product_code', '$scanner_tool', '$vurn_id', '$priority', '$GITHUB_PR_ID', '$GITHUB_PR_LINK', '$GITHUB_RUN_ID', CURRENT_TIMESTAMP);
EOF
    echo "Inserted vulnerability: $vurn_id with priority: $priority"
  done < "$NEW_VULN_FILE"
}

# Call the function to insert vulnerabilities into the database
insert_vulns_into_db

echo "New vulnerabilities inserted into the database."