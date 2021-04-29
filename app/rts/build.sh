#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
npx tsc
