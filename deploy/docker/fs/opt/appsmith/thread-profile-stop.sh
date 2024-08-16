#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

jcmd $(pgrep -f -- "-jar\sserver.jar") JFR.dump name=profile