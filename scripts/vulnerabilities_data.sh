#!/bin/bash

# Check if Trivy is installed, if not, download and install it
if ! command -v trivy &> /dev/null; then
  echo "Trivy is not installed. Installing Trivy..."
  curl -sfL https://github.com/aquasecurity/trivy/releases/latest/download/trivy_1.9.2_Linux-64bit.tar.gz | tar -xzf - trivy_1.9.2/trivy

  # Create a local bin directory if it doesn't exist
  mkdir -p "$HOME/bin"
  
  # Move Trivy to the local bin directory
  mv trivy_1.9.2/trivy "$HOME/bin/"

  # Add the local bin directory to PATH if it's not already present
  if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
    echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.zshrc"
    echo "Added $HOME/bin to PATH. Please restart your terminal or run 'source ~/.bashrc' or 'source ~/.zshrc' to apply changes."
  fi

  # Check if Trivy is successfully installed
  if ! command -v trivy &> /dev/null; then
    echo "Error: Trivy installation failed."
    exit 1
  fi
  echo "Trivy installed successfully."
fi

# Define the parameters

# IMAGE: Docker image to scan, defaulting to 'appsmith/appsmith-ce:release'
# Example: appsmith/appsmith-ce:release or appsmith/appsmith-ee:release
IMAGE="${1:-appsmith/appsmith-ce:release}"

# OLD_VULN_FILE: Path to the old vulnerabilities file for comparison. Default is 'vulnerabilities.txt'
# Example: Provide a path to an old vulnerabilities file to compare with the current scan
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

# Run the Docker Scout CVE scan and save the required data to the new vulnerabilities file
echo "Running Docker Scout CVE scan for image: $IMAGE..."
docker scout cves "$IMAGE" | \
grep -E "✗ |CVE-" | \
awk '{print $2, $3}' | \
sort | uniq | grep -v '^$' > "$NEW_VULN_FILE"

# Prepare arrays for each category of vulnerabilities
LOW=()
MEDIUM=()
HIGH=()
CRITICAL=()
UNSPECIFIED=()

# Read and categorize new vulnerabilities
if [ -s "$NEW_VULN_FILE" ]; then
    while IFS= read -r line; do
        line=$(echo "$line" | xargs)
        if [[ "$line" =~ LOW ]]; then
            LOW+=($(echo "$line" | awk '{for (i=2; i<=NF; i++) print $i}'))
        elif [[ "$line" =~ MEDIUM ]]; then
            MEDIUM+=($(echo "$line" | awk '{for (i=2; i<=NF; i++) print $i}'))
        elif [[ "$line" =~ HIGH ]]; then
            HIGH+=($(echo "$line" | awk '{for (i=2; i<=NF; i++) print $i}'))
        elif [[ "$line" =~ CRITICAL ]]; then
            CRITICAL+=($(echo "$line" | awk '{for (i=2; i<=NF; i++) print $i}'))
        elif [[ "$line" =~ UNSPECIFIED ]]; then
            UNSPECIFIED+=($(echo "$line" | awk '{for (i=2; i<=NF; i++) print $i}'))
        fi
    done < <(grep -Fvxf "$OLD_VULN_FILE" "$NEW_VULN_FILE")
else
    echo "No new vulnerabilities found for image: $IMAGE"
fi

# Output categorized results to the diff file
if [[ ${#LOW[@]} -eq 0 && ${#MEDIUM[@]} -eq 0 && ${#HIGH[@]} -eq 0 && ${#CRITICAL[@]} -eq 0 && ${#UNSPECIFIED[@]} -eq 0 ]]; then
    echo "No Diff found." > "$DIFF_OUTPUT_FILE"
    echo '{"vulnerabilities": "No Diff found."}' > "$JSON_OUTPUT_FILE"
else
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

    # Create JSON output
    json_output="{\"vulnerabilities\": {"

    first_category=true
    for category in "LOW" "MEDIUM" "HIGH" "CRITICAL" "UNSPECIFIED"; do
        eval "arr=\${$category[@]}"
        
        if [[ ${#arr[@]} -gt 0 ]]; then
            if [ "$first_category" = true ]; then
                first_category=false
            else
                json_output+=","
            fi
            
            json_output+="\"$category\": ["
            
            for item in "${arr[@]}"; do
                IFS=' ' read -r -a cve_ids <<< "$item"
                for cve_id in "${cve_ids[@]}"; do
                    json_output+="\"$cve_id\","
                done
            done

            json_output=${json_output%,}
            json_output+="]"
        fi
    done

    json_output+="}}"
    echo "$json_output" > "$JSON_OUTPUT_FILE"
fi

echo "Differences written to $DIFF_OUTPUT_FILE."
echo "JSON output written to $JSON_OUTPUT_FILE."