#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

location=/appsmith-stacks/heap_dumps/ad-hoc/${HOSTNAME}/thread-profile/profile-$(date "+%Y_%m_%d_%H_%S");
mkdir -p $location; 
jcmd $(pgrep -f -- "-jar\sserver.jar") JFR.start name=profile filename=$location.jfr