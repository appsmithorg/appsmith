#!/bin/bash

# Navigate to the client src directory
cd app/client/src || { echo "Failed to navigate to app/client/src directory"; exit 1; }

# First, find and rename files containing 'tenant' or 'tentant' in their names
find . -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    ! -path "*/cypress/fixtures/*" \
    ! -path "*/assets/*" \
    ! -name "*.pdf" \
    ! -name "*.png" \
    ! -name "*.jpg" \
    ! -name "*.jpeg" \
    ! -name "*.gif" \
    ! -name "*.mp4" \
    ! -name "*.webm" \
    ! -name "*.svg" | while read -r file; do
    
    # Check if filename contains 'tenant' or 'tentant' (case-insensitive)
    filename=$(basename "$file")
    dirname=$(dirname "$file")
    
    # Create new filename replacing both spellings
    newfilename=$(echo "$filename" | sed -e 's/tentant/organization/g' -e 's/Tentant/Organization/g' -e 's/tenant/organization/g' -e 's/Tenant/Organization/g')
    
    # If filename changed, rename the file
    if [ "$filename" != "$newfilename" ]; then
        mv "$file" "$dirname/$newfilename"
        echo "Renamed: $file → $dirname/$newfilename"
        # Update file variable to point to new location
        file="$dirname/$newfilename"
    fi
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Perform content replacements
    sed -i.tmp \
        -e 's/tentantConfiguration/organizationConfiguration/g' \
        -e 's/TentantConfiguration/OrganizationConfiguration/g' \
        -e 's/TENTANT_CONFIGURATION/ORGANIZATION_CONFIGURATION/g' \
        -e 's/tenantConfiguration/organizationConfiguration/g' \
        -e 's/TenantConfiguration/OrganizationConfiguration/g' \
        -e 's/TENANT_CONFIGURATION/ORGANIZATION_CONFIGURATION/g' \
        -e 's/\([^a-zA-Z0-9]\)tentant\([^a-zA-Z0-9]\)/\1organization\2/g' \
        -e 's/\([^a-zA-Z0-9]\)Tentant\([^a-zA-Z0-9]\)/\1Organization\2/g' \
        -e 's/\([^a-zA-Z0-9]\)TENTANT\([^a-zA-Z0-9]\)/\1ORGANIZATION\2/g' \
        -e 's/\([^a-zA-Z0-9]\)tenant\([^a-zA-Z0-9]\)/\1organization\2/g' \
        -e 's/\([^a-zA-Z0-9]\)Tenant\([^a-zA-Z0-9]\)/\1Organization\2/g' \
        -e 's/\([^a-zA-Z0-9]\)TENANT\([^a-zA-Z0-9]\)/\1ORGANIZATION\2/g' \
        -e 's/Tentant\([A-Z]\)/Organization\1/g' \
        -e 's/tentant\([A-Z]\)/organization\1/g' \
        -e 's/Tenant\([A-Z]\)/Organization\1/g' \
        -e 's/tenant\([A-Z]\)/organization\1/g' \
        -e 's/\([a-z]\)Tentant/\1Organization/g' \
        -e 's/\([a-z]\)tentant/\1organization/g' \
        -e 's/\([a-z]\)Tenant/\1Organization/g' \
        -e 's/\([a-z]\)tenant/\1organization/g' \
        "$file"
    
    # Compare files to see if content was modified
    if ! cmp -s "$file" "$file.bak"; then
        echo "Updated content: $file"
    fi
    
    # Clean up temporary files
    rm "$file.bak"
    rm "$file.tmp"
done

echo "Replacement complete!"