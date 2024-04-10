#!/usr/bin/env bash

set -e

infra_file="$TMP/infra.json"
mount_path="/appsmith-stacks"

## Check for the cloud provider
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

## Get if it is deployed on docker or kubernetes
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

## Check the hostname and IP
function get_username_ip() {
  hostname="$(cat /etc/hostname)"
}

get_cloud_provider
get_tool
get_username_ip
check_for_efs

infra_json='{"cloudProvider":"'"$cloud_provider"'","tool":"'"$dep_tool"'","EFS":"'"$efs"'","hostname":"'"$hostname"'"}'
echo $infra_json

echo $infra_json > $infra_file
