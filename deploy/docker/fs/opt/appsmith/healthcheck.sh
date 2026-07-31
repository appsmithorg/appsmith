#!/usr/bin/env bash
healthy=true
# MCP is enabled by default (APPSMITH_MCP_ENABLED). When explicitly disabled, its supervisord program is parked
# (sleep) rather than absent — so probe its health endpoint only when enabled, reading the gate from docker.env
# because the Docker HEALTHCHECK environment does not source it.
mcp_enabled_value="${APPSMITH_MCP_ENABLED:-$(grep -m1 '^APPSMITH_MCP_ENABLED=' /appsmith-stacks/configuration/docker.env 2>/dev/null | cut -d= -f2- | tr -d '"'"'")}"
if [[ "${mcp_enabled_value:-true}" =~ ^([Ff][Aa][Ll][Ss][Ee]|0|[Nn][Oo]|[Oo][Ff][Ff])$ ]]; then
  mcp_enabled=false
else
  mcp_enabled=true
fi
# MCP contributes to container health ONLY when the operator explicitly opted in with a truthy value. MCP is
# on by default, so an instance that merely upgraded into it never asked for it: an MCP-only fault there must
# not report the whole container unhealthy and have an orchestrator restart a working Appsmith. When MCP is
# explicitly enabled the operator depends on it, so it is fatal as usual.
if [[ "$mcp_enabled_value" =~ ^([Tt][Rr][Uu][Ee]|1|[Yy][Ee][Ss]|[Oo][Nn])$ ]]; then
  mcp_required=true
else
  mcp_required=false
fi
processes="editor rts backend"
if supervisorctl status | grep -q '^mcp'; then
  processes="$processes mcp"
fi
while read -r line
  do
    line_arr=($line)
    process=${line_arr[0]}
    status=${line_arr[1]}
    if [ $status != "RUNNING" ]; then
      if [[ "$process" == "mcp" && "$mcp_required" != "true" ]]; then
        echo "WARN:- PROCESS: $process - STATUS: $status (MCP not explicitly enabled; not failing container health)"
      else
        healthy=false
        echo "ERROR:- PROCESS: $process - STATUS: $status"
      fi
    else
      echo "PROCESS: $process - STATUS: $status"
      if [[ "$process" == 'editor' ]]; then
        if [[ $(curl -Lfk -s -w "%{http_code}\n" http://localhost/ -o /dev/null) -ne 200 ]]; then
          echo 'ERROR: Editor is down';
          healthy=false
        fi
      elif [[ "$process" == "server" ]]; then
        if [[ $(curl -s -w "%{http_code}\n" http://localhost:8080/api/v1/health -o /dev/null) -ne 200 ]]; then
           echo 'ERROR: Server is down';
           healthy=false
        fi
      elif [[ "$process" == "mcp" && "$mcp_enabled" == "true" ]]; then
        if [[ $(curl -s --max-time 5 -w "%{http_code}\n" http://localhost:${APPSMITH_MCP_PORT:-8092}/health -o /dev/null) -ne 200 ]]; then
           if [[ "$mcp_required" == "true" ]]; then
             echo 'ERROR: MCP is down';
             healthy=false
           else
             echo 'WARN: MCP is down (not explicitly enabled; not failing container health)'
           fi
        fi
      elif [[ "$process" == "mongo" ]]; then
        if [[ $(mongo --eval  'db.runCommand("ping").ok') -ne 1 ]]; then
            echo 'ERROR: Mongo is down';
            healthy=false
        fi
       elif [[ "$process" == "redis" ]]; then
        if [[ $(redis-cli ping) != 'PONG' ]]; then
            echo 'ERROR: Redis is down';
            healthy=false
        fi
      fi
    fi
  done <<< $(supervisorctl status $processes)
if [ $healthy == true ]; then
  exit 0
else
  exit 1
fi
