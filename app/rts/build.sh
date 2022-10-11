#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
rm -rf dist/
yarn install --frozen-lockfile
npx tsc && npx tsc-alias
tsc_exit_code=$?

# Copying node_modules directory into dist as rts server requires node_modules to run server build properly. 
# This was previously being done in dockerfile which was copying the symlinks to image rather than the whole directory of shared modules (e.g. AST)
# Also, we copy node_modules with -L flag in order to follow the symlinks for @shared folder and copy the contents instead of just the symlink
cp -RL node_modules ./dist
exit $tsc_exit_code
