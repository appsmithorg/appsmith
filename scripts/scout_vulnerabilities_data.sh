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
