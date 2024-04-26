#!/usr/bin/env bash

set -e

infra_file="$TMP/infra.json"
mount_path="/appsmith-stacks"

## Get cloudProvider details
function get_cloud_provider() {
  release_details=$(uname -r)
  if [[ $release_details == *"amzn"* ]];then
     cloud_provider="amazon";
  elif [[ $release_details == *"azure"* ]];then
     cloud_provider="azure";
  elif [[ $release_details == *"cloud"* ]];then
     cloud_provider="gcp";
  else
     cloud_provider="local";
  fi
}

## Get deployment tool details
function get_tool() {
  if [[ -z "${KUBERNETES_SERVICE_HOST}" ]]; then
    dep_tool="docker";
  else
    dep_tool="kubernetes";
  fi
}

## Check if EFS is mounted
function check_for_efs() {
  findmnt --mountpoint $mount_path | grep nfs && {
    efs="present"
} || {
    efs="absent"
}
}

## Check hostname
function get_hostname() {
  hostname="$(cat /etc/hostname)"
}

## Get current Time
function get_current_time(){
  currentTime="$(date -u -Iseconds)"
}

## Main Block
get_cloud_provider
get_tool
get_hostname
check_for_efs
get_current_time


infra_json='{"cloudProvider":"'"$cloud_provider"'","tool":"'"$dep_tool"'","efs":"'"$efs"'","hostname":"'"$hostname"'", "currentTime": "'"$currentTime"'"}'
echo "$infra_json"

echo $infra_json > $infra_file
