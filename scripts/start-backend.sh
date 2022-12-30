#!/bin/bash

set -o errexit

# Wait until RTS started and listens on port 8091
while ! curl --fail --silent localhost/rts-api/v1/health-check; do
  echo 'Waiting for RTS to start ...'
  sleep 1
done
echo 'RTS started.'

# Start server.
echo 'Starting Backend server...'
exec /opt/appsmith/run-with-env.sh /opt/appsmith/run-java.sh
