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
    jq -r --arg product "$product_name" '.Results[]? | .Vulnerabilities[]? | "\(.VulnerabilityID),\($product),TRIVY,\(.Severity)"' "trivy_vulnerabilities.json" | sort -u > "$NEW_VULN_FILE"
    echo "Vulnerabilities saved to $NEW_VULN_FILE"
else
    echo "No vulnerabilities found for image: $IMAGE"
    echo "No vulnerabilities found." > "$NEW_VULN_FILE"
fi


# Insert new vulnerabilities into PostgreSQL
insert_vulns_into_db() {
    local query_file="insert_vulns.sql"
    echo "BEGIN;" > "$query_file"

    while IFS=, read -r vurn_id product scanner_tool priority; do
        if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
            continue
        fi

        local pr_id="${GITHUB_PR_ID:-}"
        local pr_link="${GITHUB_PR_LINK:-}"
        local created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        local comments="Initial vulnerability report"
        local owner="John Doe"
        local pod="Security"

        # Remove spaces and redundant commas, and escape single quotes for SQL
        vurn_id=$(echo "$vurn_id" | sed "s/'/''/g")
        priority=$(echo "$priority" | sed "s/'/''/g")
        product=$(echo "$product" | sed "s/'/''/g" | tr -d ' ' | sed 's/,*$//')
        scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g" | tr -d ' ' | sed 's/,*$//')

        # Fetch existing product and scanner_tool values for the vulnerability
        existing_entry=$(psql -t -c "SELECT product, scanner_tool FROM vulnerability_tracking WHERE vurn_id = '$vurn_id'" "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" 2>/dev/null)

        if [ -n "$existing_entry" ]; then
            # Parse existing products and tools
            existing_product=$(echo "$existing_entry" | cut -d '|' -f 1 | tr -d ' ')
            existing_scanner_tool=$(echo "$existing_entry" | cut -d '|' -f 2 | tr -d ' ')

            # Merge with new values, ensuring uniqueness
            combined_products="$existing_product,$product"
            unique_products=$(echo "$combined_products" | tr ',' '\n' | sed '/^$/d' | sort -u | tr '\n' ',' | sed 's/^,//; s/,$//')

            combined_scanner_tools="$existing_scanner_tool,$scanner_tool"
            unique_scanner_tools=$(echo "$combined_scanner_tools" | tr ',' '\n' | sed '/^$/d' | sort -u | tr '\n' ',' | sed 's/^,//; s/,$//')
        else
            unique_products="$product"
            unique_scanner_tools="$scanner_tool"
        fi

        # Write the insert query to the SQL file
        echo "INSERT INTO vulnerability_tracking (product, scanner_tool, vurn_id, priority, pr_id, pr_link, github_run_id, created_date, update_date, comments, owner, pod) 
        VALUES ('$unique_products', '$unique_scanner_tools', '$vurn_id', '$priority', '$pr_id', '$pr_link', '$GITHUB_RUN_ID', '$created_date', '$created_date', '$comments', '$owner', '$pod')
        ON CONFLICT (vurn_id) 
        DO UPDATE SET 
            product = '$unique_products',
            scanner_tool = '$unique_scanner_tools',
            priority = EXCLUDED.priority,
            pr_id = EXCLUDED.pr_id,
            pr_link = EXCLUDED.pr_link,
            github_run_id = EXCLUDED.github_run_id,
            update_date = EXCLUDED.update_date,
            comments = EXCLUDED.comments,
            owner = EXCLUDED.owner,
            pod = EXCLUDED.pod;" >> "$query_file"
    done < "$NEW_VULN_FILE"

    echo "COMMIT;" >> "$query_file"

    # Execute the SQL file
    if psql -e "postgresql://$DB_USER:$DB_PWD@$DB_HOST/$DB_NAME" -f "$query_file"; then
        echo "Vulnerabilities successfully inserted into the database."
    else
        echo "Error: Failed to insert vulnerabilities. Check logs for details."
        exit 1
    fi
}

# Run insertion if vulnerabilities are found
if [ -s "$NEW_VULN_FILE" ]; then
    insert_vulns_into_db
else
    echo "No vulnerabilities to insert."
fi

# Cleanup
rm -f "trivy_vulnerabilities.json"