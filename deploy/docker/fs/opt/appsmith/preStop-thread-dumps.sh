#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

location=/appsmith-stacks/heap_dumps/preStop/$(date "+%Y_%m_%d_%H_%S");
mkdir -p $location; 
jstack $(pgrep -f -- "-jar\sserver.jar") > $location/trace-${HOSTNAME}.log