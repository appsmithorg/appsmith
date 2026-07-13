#!/bin/bash

# MCP is enabled by default; park the program (instead of exiting, which would crash-loop supervisord) only when
# APPSMITH_MCP_ENABLED is explicitly turned off. Toggling from Admin Settings -> Configuration restarts this program
# with the fresh docker.env (via run-with-env.sh), so the gate re-evaluates without a container restart.
shopt -s nocasematch
if [[ "${APPSMITH_MCP_ENABLED:-true}" =~ ^(false|0|no|off)$ ]]; then
  echo "MCP server is disabled (APPSMITH_MCP_ENABLED=${APPSMITH_MCP_ENABLED}). Parking."
  exec sleep infinity
fi
shopt -u nocasematch

exec node --enable-source-maps /opt/appsmith/mcp/bundle/server.js
