#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

location=/appsmith-stacks/heap_dumps/processdumps/$(date "+%Y_%m_%d_%H_%S");
mkdir -p $location; 
jcmd $(pgrep -f -- "-jar\sserver.jar") GC.heap_dump $location/${HOSTNAME}.log
