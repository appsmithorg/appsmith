#!/bin/bash

shopt -s nocasematch
shopt -u nocasematch
exec node --enable-source-maps /opt/appsmith/mcp/bundle/server.js
