#!/bin/bash

# update-cursor-docs.sh
# Pre-commit hook script to update Cursor documentation based on code changes

set -e

CURSOR_DIR=".cursor"
CODEBASE_MAP="${CURSOR_DIR}/appsmith-codebase-map.md"
TECHNICAL_DETAILS="${CURSOR_DIR}/appsmith-technical-details.md"
RULES_DIR="${CURSOR_DIR}/rules"

echo "🔍 Checking for updates to Cursor documentation..."

# Function to check if file needs to be included in the commit
add_to_commit_if_changed() {
  local file=$1
  if git diff --name-only --cached | grep -q "$file"; then
    echo "✅ $file is already staged for commit"
  elif git diff --name-only | grep -q "$file"; then
    echo "📝 Adding modified $file to commit"
    git add "$file"
  fi
}

# Get list of changed files in this commit
CHANGED_FILES=$(git diff --cached --name-only)

# Check if we need to update the codebase map
update_codebase_map() {
  local need_update=false
  
  # Check for directory structure changes
  if echo "$CHANGED_FILES" | grep -q "^app/.*/$"; then
    need_update=true
  fi
  
  # Check for major file additions
  if echo "$CHANGED_FILES" | grep -q -E '\.(java|tsx?|jsx?)$' | wc -l | grep -q -v "^0$"; then
    need_update=true
  fi
  
  if [ "$need_update" = true ]; then
    echo "🔄 Updating Codebase Map documentation..."
    
    # Append a timestamp to the file to mark it as updated
    echo -e "\n\n> Last updated: $(date)" >> "$CODEBASE_MAP"
    
    # In a real implementation, you would call an external script or Cursor API
    # to analyze the codebase and update the map file
    echo "ℹ️ Codebase Map should be manually reviewed to ensure accuracy"
    
    add_to_commit_if_changed "$CODEBASE_MAP"
  else
    echo "✅ Codebase Map does not need updates"
  fi
}

# Check if we need to update the technical details
update_technical_details() {
  local need_update=false
  
  # Check for framework changes
  if echo "$CHANGED_FILES" | grep -q -E 'package\.json|pom\.xml|build\.gradle'; then
    need_update=true
  fi
  
  # Check for core component changes
  if echo "$CHANGED_FILES" | grep -q -E 'src/(components|widgets|services)/.*\.(tsx?|java)$'; then
    need_update=true
  fi
  
  if [ "$need_update" = true ]; then
    echo "🔄 Updating Technical Details documentation..."
    
    # Append a timestamp to the file to mark it as updated
    echo -e "\n\n> Last updated: $(date)" >> "$TECHNICAL_DETAILS"
    
    # In a real implementation, you would call an external script or Cursor API
    # to analyze the codebase and update the technical details file
    echo "ℹ️ Technical Details should be manually reviewed to ensure accuracy"
    
    add_to_commit_if_changed "$TECHNICAL_DETAILS"
  else
    echo "✅ Technical Details do not need updates"
  fi
}

# Check if we need to update Cursor rules
update_cursor_rules() {
  local need_update=false
  
  # Update rules if specific patterns are found in changed files
  if echo "$CHANGED_FILES" | grep -q -E 'app/client/src/(widgets|components)|app/server/.*/(controllers|services)/'; then
    need_update=true
  fi
  
  if [ "$need_update" = true ]; then
    echo "🔄 Checking Cursor rules for updates..."
    
    # In a real implementation, you would call an external script or Cursor API
    # to analyze rule relevance and update rules
    
    # Add timestamp to index.mdc to mark rules as checked
    if [ -f "$RULES_DIR/index.mdc" ]; then
      echo -e "\n\n> Rules checked: $(date)" >> "$RULES_DIR/index.mdc"
      add_to_commit_if_changed "$RULES_DIR/index.mdc"
    fi
    
    echo "ℹ️ Cursor rules should be manually reviewed to ensure they're up to date"
  else
    echo "✅ Cursor rules do not need updates"
  fi
}

# Main execution
update_codebase_map
update_technical_details
update_cursor_rules

echo "✅ Cursor documentation check complete"

exit 0 