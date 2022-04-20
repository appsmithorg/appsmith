#!/usr/bin/env bash
healthy=true
while read -r line
  do
    line_arr=($line)
    process=${line_arr[0]}
    status=${line_arr[1]}
    if [ $status != "RUNNING" ]; then
      healthy=false
      echo "ERROR:- PROCESS: $process - STATUS: $status"
    else
      echo "PROCESS: $process - STATUS: $status"
    fi
  done <<< $(supervisorctl status all)
if [ $healthy == true ]; then
  exit 0
else
  exit 1
fi