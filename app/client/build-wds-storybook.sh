#!/bin/bash

# Build WDS storybook and move to the static folder
yarn --cwd packages/storybook build
mv -f ./packages/storybook/storybook-static ./build/storybook

