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


# Compare each vulnerability with the database and store new ones in a CSV file
compare_and_store_vulns() {
    local new_vulns_file="trivy_new_vulnerabilities.csv"
    
    echo "vurn_id,product,scanner_tool,priority" > "$new_vulns_file"  # CSV header

    while IFS=, read -r vurn_id product scanner_tool priority; do
        if [[ -z "$vurn_id" || -z "$priority" || -z "$product" || -z "$scanner_tool" ]]; then
            continue
        fi

        # Remove spaces and redundant commas, and escape single quotes for SQL
        vurn_id=$(echo "$vurn_id" | sed "s/'/''/g")
        priority=$(echo "$priority" | sed "s/'/''/g")
        product=$(echo "$product" | sed "s/'/''/g" | tr -d ' ' | sed 's/,*$//')
        scanner_tool=$(echo "$scanner_tool" | sed "s/'/''/g" | tr -d ' ' | sed 's/,*$//')

        # Check if vurn_id exists in the database
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

        # If the vulnerability is new, store it in the CSV file
        if [[ -z "$existing_entry" ]]; then
            echo "$vurn_id,$unique_products,$unique_scanner_tools,$priority" >> "$new_vulns_file"
            echo "New vulnerability detected: $vurn_id"
        else
            echo "Skipping existing vulnerability: $vurn_id"
        fi

    done < "$NEW_VULN_FILE"

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

# Run comparison and storage if vulnerabilities are found
if [ -s "$NEW_VULN_FILE" ]; then
    compare_and_store_vulns
else
    echo "No vulnerabilities to process."
fi

# Cleanup
rm -f "trivy_vulnerabilities.json"
