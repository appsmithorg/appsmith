#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
rm -rf dist/
# Using `yarn workspaces focus` instead of `yarn install` to only install dependencies for appsmith-rts.
# This helps to reduce the size of the docker image.
yarn workspaces focus appsmith-rts
yarn tsc && yarn tsc-alias
tsc_exit_code=$?

# Copying the root’s and the package’s node_modules directories into dist as rts server requires node_modules to run server build properly.
# This was previously being done in dockerfile which was copying the symlinks to image rather than the whole directory of shared modules (e.g. AST)
# - We copy node_modules with -L flag in order to follow the symlinks for @shared folder and copy the contents instead of just the symlink
# - We also remove ../node_modules/appsmith-rts as it symlinks to the current directory and will cause `cp` to fail
rm ../node_modules/appsmith-rts
cp -RL ../node_modules ./dist
exit $tsc_exit_code
