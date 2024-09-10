#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

# Define the log file path
log_dir=$1
log_file=$log_dir/loop.log

# Ensure the log directory exists
mkdir -p $log_dir

# Start logging
echo "Script started at $(date)" > $log_file

# Run the loop for 24 hours (or 24 attempts)
for i in {1..24}; do
    echo "Attempt $i at $(date)" >> $log_file

    location=$log_dir/heap_dumps/ad-hoc-24-hours/${HOSTNAME}/thread-profile/profile-$(date "+%Y_%m_%d_%H_%M_%S")
    mkdir -p $location
    echo "Created directory $location" >> $log_file

    # Get the PID of the Java process
    pid=$(pgrep -f -- "-jar\sserver.jar")
    if [ -z "$pid" ]; then
        echo "Java process not found, skipping this attempt." >> $log_file
        continue
    fi

    echo "Found Java PID: $pid" >> $log_file

    # Stop any ongoing JFR recording
    jcmd $pid JFR.stop name=profile || true
    echo "Stopped previous JFR recording (if any)" >> $log_file

    # Start a new JFR recording
    jcmd $pid JFR.start name=profile filename=$location.jfr 
    echo "Started new JFR recording: $location.jfr" >> $log_file

    # Wait for an hour before taking the next thread dump
    echo "Sleeping for 1 hour..." >> $log_file
    sleep 3600
    jcmd $pid JFR.stop name=profile || true
done >> $log_file 2>&1 &

# Detach the process from the terminal
disown
echo "Script disowned, running in background." >> $log_file
