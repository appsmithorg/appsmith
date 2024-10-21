#!/bin/bash

# Define the maximum number of retries for installing Docker Scout
MAX_RETRIES=3

# Function to install Docker Scout
install_docker_scout() {
    echo "Installing Docker Scout..."
    local attempts=0

    while [ $attempts -lt $MAX_RETRIES ]; do
        echo "Attempt $((attempts + 1))..."
        curl -fsSL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh -o install-scout.sh
        sh install-scout.sh && break  # Break if successful
        echo "Attempt $((attempts + 1)) failed. Retrying..."
        ((attempts++))
        sleep 2  # Wait before retrying
    done

    if ! command -v scout &> /dev/null; then
        echo "Error: Docker Scout installation failed."
        echo "Check the install_scout_log.txt for more details."
        exit 1
    fi

    echo "Docker Scout installed successfully."
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

# Define the parameters
IMAGE="${1:-appsmith/appsmith-ce:release}"
OLD_VULN_FILE="${2:-vulnerabilities.txt}"

# Define output files
NEW_VULN_FILE="scout_vulnerabilities_new.txt"
DIFF_OUTPUT_FILE="scout_vulnerabilities_diff.txt"
JSON_OUTPUT_FILE="scout_vulnerabilities.json"

# Remove existing files and create new ones
rm -f "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE" "$JSON_OUTPUT_FILE"
touch "$NEW_VULN_FILE" "$DIFF_OUTPUT_FILE" "$JSON_OUTPUT_FILE"

# Create an empty OLD_VULN_FILE if it does not exist
if [ ! -f "$OLD_VULN_FILE" ]; then
    touch "$OLD_VULN_FILE"
fi

# Run the Docker Scout CVE scan and output to the new vulnerabilities file
echo "Running Docker Scout CVE scan for image: $IMAGE..."
docker scout cves "$IMAGE" | \
grep -E "✗ |CVE-" | \
awk '{print $2, $3}' | \
sort | uniq | \
grep -v '^[[:space:]]*$' > "$NEW_VULN_FILE"  # Only write non-blank lines

# Check if there are any vulnerabilities in the scan
if [ -s "$NEW_VULN_FILE" ]; then
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