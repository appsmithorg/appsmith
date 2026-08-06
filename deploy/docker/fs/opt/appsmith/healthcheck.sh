#!/usr/bin/env bash
healthy=true
# MCP is OFF unless explicitly enabled (APPSMITH_MCP_ENABLED). Its supervisord program is always installed and parks
# (sleep) when disabled rather than being absent, so probe its health endpoint only when the gate is on — read from
# docker.env because the Docker HEALTHCHECK environment does not source it. Allow-list spelling, matching every other
# layer: absent, blank, or unrecognized means disabled. Because enablement is opt-in, an instance is only marked
# unhealthy for MCP when an operator deliberately turned it on and therefore depends on it.
mcp_enabled_value="${APPSMITH_MCP_ENABLED:-$(grep -m1 '^APPSMITH_MCP_ENABLED=' /appsmith-stacks/configuration/docker.env 2>/dev/null | cut -d= -f2- | tr -d '"'"'")}"
if [[ "$mcp_enabled_value" =~ ^([Tt][Rr][Uu][Ee]|1|[Yy][Ee][Ss]|[Oo][Nn])$ ]]; then
  mcp_enabled=true
else
  mcp_enabled=false
fi
mcp_required="$mcp_enabled"
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
