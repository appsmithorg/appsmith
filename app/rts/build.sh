#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
rm -rf dist/
# This is required for the first time build as node_modules is not present in the image
yarn install --immutable
yarn tsc && yarn tsc-alias
# Keep copy of all dependencies in node_modules_bkp
mv node_modules node_modules_bkp
# Install only production dependencies
YARN_NM_HOISTING_LIMITS=workspaces yarn workspaces focus --production appsmith-rts

# Copying node_modules directory into dist as rts server requires production dependencies to run server build properly.
# This was previously being done in dockerfile which was copying the symlinks to image rather than the whole directory of shared modules (e.g. AST)
# Also, we copy node_modules with -L flag in order to follow the symlinks for @shared folder and copy the contents instead of just the symlink
cp -RL node_modules ./dist
# Delete production dependencies
rm -rf node_modules
# Restore all dependencies
mv node_modules_bkp node_modules
