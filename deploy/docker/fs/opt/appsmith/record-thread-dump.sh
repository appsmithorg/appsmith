#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

arg=${1:-}

# Set the location based on the argument
if [ "$arg" == "preStop" ]; then
  location=/appsmith-stacks/heap_dumps/preStop/${HOSTNAME}/$(date "+%Y_%m_%d_%H_%S");
else
  location=/appsmith-stacks/heap_dumps/ad-hoc/${HOSTNAME}/thread-profile/$(date "+%Y_%m_%d_%H_%S");
fi

mkdir -p $location; 
jstack $(pgrep -f -- "-jar\sserver.jar") > $location.log
