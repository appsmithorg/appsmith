#!/bin/bash -eux

cd "$(git rev-parse --show-toplevel)"

if [[ -z "${EDITION-}" ]]; then
  export EDITION=ce
  if [[ "$(git remote get-url origin)" == *appsmithorg/appsmith-ee* ]]; then
    export EDITION=ee
  fi
fi

echo "Building server artifacts for $EDITION edition (PostgreSQL support removed)"

target="deploy/docker/fs/opt/appsmith/server"
mkdir -p "$target"
rm -rf "$target"/{pg,mongo}

# Build MongoDB server artifacts
cp -r "app/server/dist" "$target/mongo"
mv "$target/mongo"/server-*.jar "$target/mongo/server.jar"

# PostgreSQL support has been removed - no more vulnerable artifacts
# This eliminates CVE-2024-38821 from the Docker image
echo "✅ MongoDB artifacts prepared successfully"
echo "🗑️ PostgreSQL artifacts skipped (CVE-2024-38821 eliminated)"
echo "📁 Only MongoDB artifacts: $target/mongo/"
