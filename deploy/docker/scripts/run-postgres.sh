#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

rm -f /appsmith-stacks/data/postgres/core.*
exec /usr/lib/postgresql/13/bin/postgres -D "/appsmith-stacks/data/postgres/main" -c listen_addresses=127.0.0.1 -c stats_temp_directory=/tmp
