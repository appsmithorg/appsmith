#!/bin/bash

# Define the folder and postfix
FOLDER="./cypress/e2e"
POSTFIX="spec.js"
OUTPUT_CSV="output.csv"

# Initialize the CSV file with headers
echo "rowNum,folder,filename,tags1,tags2,tags3,tags4,tags5,tags6,tags7,tags8,tags9" > "$OUTPUT_CSV"

# Initialize row number counter
rowNum=1

# Find all files in the folder with the specified postfix and process each one
find "$FOLDER" -name "*$POSTFIX" | while read -r file; do
    # Extract the directory path and filename
    dirpath=$(dirname "$file")
    filename=$(basename "$file")

    # Extract tags from the describe section using grep and awk
    tags=$(awk -v RS='[{}]' '/tags:/ {gsub(/[["\]]/, ""); print $0}' "$file" | grep -Eo '@tag\.[A-Za-z0-9_-]+')

    # Remove brackets and split tags into an array
    IFS=',' read -r -a tagArray <<< "$(echo "$tags" | tr '\n' ',' | sed 's/,$//')"

    # Initialize empty tag variables for up to 9 tags
    tags1=""; tags2=""; tags3=""; tags4=""; tags5=""
    tags6=""; tags7=""; tags8=""; tags9=""

    # Assign tags to respective variables
    if [ ${#tagArray[@]} -gt 0 ]; then tags1="${tagArray[0]}"; fi
    if [ ${#tagArray[@]} -gt 1 ]; then tags2="${tagArray[1]}"; fi
    if [ ${#tagArray[@]} -gt 2 ]; then tags3="${tagArray[2]}"; fi
    if [ ${#tagArray[@]} -gt 3 ]; then tags4="${tagArray[3]}"; fi
    if [ ${#tagArray[@]} -gt 4 ]; then tags5="${tagArray[4]}"; fi
    if [ ${#tagArray[@]} -gt 5 ]; then tags6="${tagArray[5]}"; fi
    if [ ${#tagArray[@]} -gt 6 ]; then tags7="${tagArray[6]}"; fi
    if [ ${#tagArray[@]} -gt 7 ]; then tags8="${tagArray[7]}"; fi
    if [ ${#tagArray[@]} -gt 8 ]; then tags9="${tagArray[8]}"; fi

    # Append the data to the CSV file
    echo "$rowNum,$dirpath,$filename,$tags1,$tags2,$tags3,$tags4,$tags5,$tags6,$tags7,$tags8,$tags9" >> "$OUTPUT_CSV"

    # Increment row number
    rowNum=$((rowNum + 1))
done

echo "CSV file created: $OUTPUT_CSV"