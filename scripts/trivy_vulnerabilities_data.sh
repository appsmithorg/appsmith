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

# Assign parameters from the workflow
IMAGE="$1"
GITHUB_PR_ID="$2"
GITHUB_PR_LINK="$3"
GITHUB_RUN_ID="$4"
OLD_VULN_FILE="${5:-vulnerability_base_data.csv}"

MAX_RETRIES=5

# Function to install Trivy with retry logic
install_trivy_with_retry() {
    local count=0
    local success=false

    while [[ $count -lt $MAX_RETRIES ]]; do
        echo "Attempting to install Trivy (attempt $((count + 1)))..."
        
        TRIVY_VERSION=$(curl -s https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
        TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/v$TRIVY_VERSION/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz"
        
        curl -sfL "$TRIVY_URL" | tar -xzf - trivy
        if [[ $? -eq 0 ]]; then
            mkdir -p "$HOME/bin"
            mv trivy "$HOME/bin/"
            export PATH="$HOME/bin:$PATH"
            if command -v trivy &> /dev/null; then
                success=true
                break
            fi
        fi
        
        echo "Trivy installation failed. Retrying..."
        count=$((count + 1))
    done

    if [[ $success = false ]]; then
        echo "Error: Trivy installation failed after $MAX_RETRIES attempts."
        exit 1
    fi
    echo "Trivy installed successfully."
}

# Check if Trivy is installed, if not, install it
if ! command -v trivy &> /dev/null; then
    install_trivy_with_retry
fi

NEW_VULN_FILE="trivy_vulnerabilities_new.csv"
DIFF_OUTPUT_FILE="trivy_vulnerabilities_diff.csv"

rm -f "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE"
touch "$OLD_VULN_FILE"

# Determine product name based on the image name
case "$IMAGE" in
    *appsmith/appsmith-ce:*) product_name="CE" ;;
    *appsmith/appsmith-ee:*) product_name="EE" ;;
    *appsmith/cloud-services:*) product_name="CLOUD" ;;
    *) product_name="UNKNOWN" ;;
esac

# Function to run Trivy scan
run_trivy_scan() {
    echo "Cleaning up Trivy data..."
    trivy clean --all
    echo "Running Trivy scan for image: $IMAGE..."
    if ! trivy image --db-repository public.ecr.aws/aquasecurity/trivy-db --java-db-repository public.ecr.aws/aquasecurity/trivy-java-db --insecure --format json "$IMAGE" > "trivy_vulnerabilities.json"; then
        echo "Error: Trivy is not available or the image does not exist."
        exit 1
    fi
}

# Run the scan
run_trivy_scan

# Process vulnerabilities and generate CSV
if jq -e '.Results | length > 0' "trivy_vulnerabilities.json" > /dev/null; then
    jq -r --arg product "$product_name" '.Results[].Vulnerabilities[] | "\(.VulnerabilityID),\($product),TRIVY,\(.Severity)"' "trivy_vulnerabilities.json" | sort -u > "$NEW_VULN_FILE"
    echo "Vulnerabilities saved to $NEW_VULN_FILE"
else
    echo "No vulnerabilities found for image: $IMAGE"
    echo "No vulnerabilities found." > "$NEW_VULN_FILE"
fi

# Compare vulnerabilities with the old file
sort "$OLD_VULN_FILE" -o "$OLD_VULN_FILE"
sort "$NEW_VULN_FILE" -o "$NEW_VULN_FILE"
comm -13 "$OLD_VULN_FILE" "$NEW_VULN_FILE" > "$DIFF_OUTPUT_FILE"

if [ -s "$DIFF_OUTPUT_FILE" ]; then
    echo "New vulnerabilities found and recorded in $DIFF_OUTPUT_FILE."
else
    echo "No new vulnerabilities found for image: $IMAGE."
fi

# Cleanup JSON file
rm -f "trivy_vulnerabilities.json"

# Insert new vulnerabilities into PostgreSQL
insert_vulns_into_db() {
  local query_file="insert_vulns.sql"
  echo "BEGIN;" > "$query_file" 

  while IFS=, read -r vurn_id product scanner_tool priority; do
    if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
      continue
    fi

    local pr_id="$GITHUB_PR_ID"
    local pr_link="$GITHUB_PR_LINK"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local comments="Initial vulnerability report"
    local owner="John Doe"
    local pod="Security"

    vurn_id=$(echo "$vurn_id" | sed "s/'/''/g")
    priority=$(echo "$priority" | sed "s/'/''/g")
    product=$(echo "$product" | sed "s/'/''/g")
    scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g")

    existing_entry=$(psql -t -c "SELECT product, scanner_tool FROM vulnerability_tracking WHERE vurn_id = '$vurn_id'" "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" | xargs)
    existing_product=$(echo "$existing_entry" | awk '{print $1}')
    existing_scanner_tool=$(echo "$existing_entry" | awk '{print $2}')

    if [[ -n "$existing_product" ]]; then
      combined_products="$existing_product, $product"
      product=$(echo "$combined_products" | tr ', ' '\n' | sort -u | tr '\n' ',' | sed 's/^,//;s/,$//')
    fi
    if [[ -n "$existing_scanner_tool" ]]; then
      combined_scanner_tools="$existing_scanner_tool, $scanner_tool"
      scanner_tool=$(echo "$combined_scanner_tools" | tr ', ' '\n' | sort -u | tr '\n' ',' | sed 's/^,//;s/,$//')
    fi

    echo "INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod) 
    VALUES ('$product', '$scanner_tool', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$created_date', '$comments', '$owner', '$pod')
    ON CONFLICT (vurn_id) 
    DO UPDATE SET 
        product = EXCLUDED.product,
        scanner_tool = EXCLUDED.scanner_tool,
        priority = EXCLUDED.priority,
        pr_id = EXCLUDED.pr_id,
        pr_link = EXCLUDED.pr_link,
        github_run_id = EXCLUDED.github_run_id,
        update_date = EXCLUDED.update_date,
        comments = EXCLUDED.comments,
        owner = EXCLUDED.owner,
        pod = EXCLUDED.pod;" >> "$query_file"

  done < "$DIFF_OUTPUT_FILE"

  echo "COMMIT;" >> "$query_file"
  psql -e "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" -f "$query_file"

  if [ $? -eq 0 ]; then
    echo "Vulnerabilities successfully inserted into the database."
  else
    echo "Error: Failed to insert vulnerabilities."
    exit 1
  fi
}

# Insert data if any new vulnerabilities found
if [ -s "$DIFF_OUTPUT_FILE" ]; then
  insert_vulns_into_db
else
  echo "No new vulnerabilities to insert."
fi