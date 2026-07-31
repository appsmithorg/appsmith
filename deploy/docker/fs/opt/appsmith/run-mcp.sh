#!/bin/bash

# MCP is OFF unless explicitly enabled; park the program (instead of exiting, which would crash-loop supervisord)
# unless APPSMITH_MCP_ENABLED carries a recognized truthy value. Toggling from Admin Settings -> MCP Server restarts
# this program with the fresh docker.env (via run-with-env.sh), so the gate re-evaluates without a container restart.
shopt -s nocasematch
if [[ ! "${APPSMITH_MCP_ENABLED:-false}" =~ ^(true|1|yes|on)$ ]]; then
  echo "MCP server is disabled (APPSMITH_MCP_ENABLED=${APPSMITH_MCP_ENABLED:-unset}). Parking."
  exec sleep infinity
fi
shopt -u nocasematch

exec node --enable-source-maps /opt/appsmith/mcp/bundle/server.js
