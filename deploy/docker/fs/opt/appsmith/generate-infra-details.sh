#!/usr/bin/env bash

set -e

infra_file="$TMP/infra.json"
mount_path="/appsmith-stacks"

## Get cloudProvider details
function get_cloud_provider() {
  release_details=$(uname -r)
  if [[ $release_details == *"amzn"* ]];then
     # Example: 5.10.192-183.736.amzn2.x86_64
     cloud_provider="amazon";
  elif [[ $release_details == *"azure"* ]];then
     # Example: 5.15.0-1059-azure
     cloud_provider="azure";
  elif [[ $release_details == *"cloud"* ]];then
     # Example: 6.1.0-18-cloud-amd64
     cloud_provider="gcp";
  elif [[ $release_details == *"generic"* ]];then
     # Example: 6.8.0-31-generic
     cloud_provider="digitalocean"
  elif [[ $release_details == *"ecs"* ]];then
     cloud_provider="alibaba"
  elif [[ -n "${DYNO}" ]];then
     cloud_provider="heroku"
  else
     cloud_provider="others(including local)";
  fi
}

## Get deployment tool details
function get_tool() {
  if [[ -z "${KUBERNETES_SERVICE_HOST}" ]]; then
    dep_tool="likely docker";
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

## Check if it's a ECS Fargate deployment
function check_for_fargate() {
  if [[ $cloud_provider == "amazon" && $dep_tool == "likely docker" && $efs == "present" ]]; then
    dep_tool="ecs-fargate"
  fi
}

## Main Block
get_cloud_provider
get_tool
get_hostname
check_for_efs
check_for_fargate
get_current_time

infra_json='{"cloudProvider":"'"$cloud_provider"'","tool":"'"$dep_tool"'","efs":"'"$efs"'","hostname":"'"$hostname"'", "currentTime": "'"$currentTime"'"}'
echo "$infra_json"

echo $infra_json > $infra_file
