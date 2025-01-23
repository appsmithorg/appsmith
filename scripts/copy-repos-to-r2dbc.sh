#!/bin/bash

SRC_DIR="app/server/appsmith-server/src/main/java/com/appsmith/server/repositories"
DEST_DIR="$SRC_DIR/r2dbc"

# Create r2dbc directory
mkdir -p "$DEST_DIR"

# Copy all repository files
find "$SRC_DIR" -name "*Repository.java" -not -path "*/r2dbc/*" | while read file; do
    # Get relative path
    rel_path=${file#$SRC_DIR/}
    # Create destination directory
    mkdir -p "$DEST_DIR/$(dirname $rel_path)"
    # Copy file
    cp "$file" "$DEST_DIR/$rel_path"
    # Rename to R2DBCRepository
    mv "$DEST_DIR/$rel_path" "${DEST_DIR}/${rel_path%.java}R2DBC.java"
done 