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
  done <<< $(supervisorctl status editor rts backend)
if [ $healthy == true ]; then
  exit 0
else
  exit 1
fi
