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
rm -f "$NEW_VULN_FILE"

# Determine product name based on the image name
case "$IMAGE" in
    *appsmith/appsmith-ce:*) product_name="CE" ;;
    *appsmith/appsmith-ee:*) product_name="EE" ;;
    *appsmith/cloud-services:*) product_name="CLOUD" ;;
    *) product_name="UNKNOWN" ;;
esac

# Run Trivy scan
echo "Running Trivy scan for image: $IMAGE..."
trivy image --db-repository public.ecr.aws/aquasecurity/trivy-db --java-db-repository public.ecr.aws/aquasecurity/trivy-java-db --insecure --format json "$IMAGE" > "trivy_vulnerabilities.json" || {
    echo "Error: Trivy scan failed for image: $IMAGE"
    exit 1
}

# Process vulnerabilities and generate CSV
if jq -e '.Results | length > 0' "trivy_vulnerabilities.json" > /dev/null; then
    jq -r --arg product "$product_name" '.Results[].Vulnerabilities[] | "\(.VulnerabilityID),\($product),TRIVY,\(.Severity)"' "trivy_vulnerabilities.json" | sort -u > "$NEW_VULN_FILE"
    echo "Vulnerabilities saved to $NEW_VULN_FILE"
else
    echo "No vulnerabilities found for image: $IMAGE"
    echo "No vulnerabilities found." > "$NEW_VULN_FILE"
fi

# Insert new vulnerabilities into PostgreSQL
insert_vulns_into_db() {
  local query_file="insert_vulns.sql"

  # Clear previous query file content and start a transaction block
  echo "BEGIN;" > "$query_file"

  # Loop through each vulnerability record in NEW_VULN_FILE
  while IFS=, read -r vurn_id product scanner_tool priority; do
    if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
      continue
    fi

    # Variables for database insertion
    local pr_id="${GITHUB_PR_ID:-}"
    local pr_link="${GITHUB_PR_LINK:-}"
    local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local comments="Initial vulnerability report"
    local owner="John Doe"
    local pod="Security"

    # Escape single quotes in the variables
    vurn_id=$(echo "$vurn_id" | sed "s/'/''/g")
    priority=$(echo "$priority" | sed "s/'/''/g")
    product=$(echo "$product" | sed "s/'/''/g")
    scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g")

    # Add insert statement to the query file
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

  done < "$NEW_VULN_FILE"

  # Commit the transaction
  echo "COMMIT;" >> "$query_file"

  # Execute the SQL statements
  if psql -e "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" -f "$query_file"; then
    echo "Vulnerabilities successfully inserted into the database."
  else
    echo "Error: Failed to insert vulnerabilities. Check logs for details."
    exit 1
  fi
}

# Insert data if vulnerabilities are found
if [ -s "$NEW_VULN_FILE" ]; then
  insert_vulns_into_db
else
  echo "No vulnerabilities to insert."
fi

# Cleanup
rm -f "trivy_vulnerabilities.json"