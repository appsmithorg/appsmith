#!/bin/bash

# Define the maximum number of retries
MAX_RETRIES=3

# Function to install Trivy with retry logic
install_trivy_with_retry() {
    local count=0
    local success=false

    while [[ $count -lt $MAX_RETRIES ]]; do
        echo "Attempting to install Trivy (attempt $((count + 1)))..."
        
        # Fetch the latest release dynamically instead of hardcoding
        TRIVY_VERSION=$(curl -s https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
        TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/v$TRIVY_VERSION/trivy_"$TRIVY_VERSION"_Linux-64bit.tar.gz"
        
        # Download and extract Trivy
        curl -sfL "$TRIVY_URL" | tar -xzf - trivy
        
        # Check if extraction was successful
        if [[ $? -eq 0 ]]; then
            # Create a local bin directory if it doesn't exist
            mkdir -p "$HOME/bin"
            # Move Trivy to the local bin directory
            mv trivy "$HOME/bin/"
            # Manually add the bin directory to PATH for this session
            export PATH="$HOME/bin:$PATH"

            # Check if Trivy is successfully installed
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

# Check if Trivy is installed, if not, install it with retry logic
if ! command -v trivy &> /dev/null; then
    install_trivy_with_retry
fi

# Define the parameters
IMAGE="${1:-appsmith/appsmith-ce:release}"
OLD_VULN_FILE="${2:-vulnerabilities.txt}"

# Define output files
NEW_VULN_FILE="vulnerabilities_new.txt"
DIFF_OUTPUT_FILE="vulnerabilities_diff.txt"
JSON_OUTPUT_FILE="vulnerabilities.json"

# Remove existing files and create new ones
rm -f "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE" "$JSON_OUTPUT_FILE"
touch "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE" "$JSON_OUTPUT_FILE"

# Create an empty OLD_VULN_FILE if it does not exist
if [ ! -f "$OLD_VULN_FILE" ]; then
    touch "$OLD_VULN_FILE"
fi

# Run the Trivy scan and output to JSON file
echo "Running Trivy scan for image: $IMAGE..."
if ! trivy image --format json "$IMAGE" > "$JSON_OUTPUT_FILE"; then
    echo "Error: Trivy is not available or the image does not exist."
    exit 1
fi

# Check if there are any vulnerabilities in the scan
if jq -e '.Results | length > 0' "$JSON_OUTPUT_FILE" > /dev/null; then
    # Extract vulnerabilities into the new vulnerabilities file
    jq -r '.Results[].Vulnerabilities[] | "\(.Severity) \(.VulnerabilityID)"' "$JSON_OUTPUT_FILE" | \
    sed 's/^\s*//;s/\s*$//' | \
    awk '{if ($1 == "") {print "UNSPECIFIED " $2} else {print}}' | \
    sort -u > "$NEW_VULN_FILE"

    echo "Vulnerabilities saved to $NEW_VULN_FILE"
else
    echo "No vulnerabilities found for image: $IMAGE"
    echo "No vulnerabilities found." > "$NEW_VULN_FILE"
fi

# Prepare arrays for categorized vulnerabilities
LOW=()
MEDIUM=()
HIGH=()
CRITICAL=()
UNSPECIFIED=()

# Categorize new vulnerabilities
if [ -s "$NEW_VULN_FILE" ]; then
    while IFS= read -r line; do
        if [[ "$line" =~ LOW ]]; then
            LOW+=($(echo "$line" | awk '{print $2}'))
        elif [[ "$line" =~ MEDIUM ]]; then
            MEDIUM+=($(echo "$line" | awk '{print $2}'))
        elif [[ "$line" =~ HIGH ]]; then
            HIGH+=($(echo "$line" | awk '{print $2}'))
        elif [[ "$line" =~ CRITICAL ]]; then
            CRITICAL+=($(echo "$line" | awk '{print $2}'))
        else
            UNSPECIFIED+=($(echo "$line" | awk '{print $2}'))
        fi
    done < <(grep -Fvxf "$OLD_VULN_FILE" "$NEW_VULN_FILE")
else
    echo "No new vulnerabilities found for image: $IMAGE"
fi

# Output categorized results to the diff file
{
    echo "Vulnerabilities introduced in $NEW_VULN_FILE but not in $OLD_VULN_FILE:"
    
    for category in "LOW" "MEDIUM" "HIGH" "CRITICAL" "UNSPECIFIED"; do
        eval "arr=\${$category[@]}"
        
        if [[ ${#arr[@]} -gt 0 ]]; then
            echo "Category: $category"
            printf '%s\n' "${arr[@]}"
        else
            echo "No new vulnerabilities in category: $category"
        fi
    done
} > "$DIFF_OUTPUT_FILE"

# Create JSON output for categorized vulnerabilities
json_output="{\"vulnerabilities\": {"
first_category=true
for category in "LOW" "MEDIUM" "HIGH" "CRITICAL" "UNSPECIFIED"; do
    eval "arr=\${$category[@]}"
    if [[ ${#arr[@]} -gt 0 ]]; then
        [[ "$first_category" = true ]] && first_category=false || json_output+=","
        json_output+="\"$category\": ["
        for item in "${arr[@]}"; do
            json_output+="\"$item\","
        done
        json_output=${json_output%,} # Remove trailing comma
        json_output+="]"
    fi
done
json_output+="}}"
echo "$json_output" > "$JSON_OUTPUT_FILE"

echo "Differences written to $DIFF_OUTPUT_FILE."
echo "JSON output written to $JSON_OUTPUT_FILE."