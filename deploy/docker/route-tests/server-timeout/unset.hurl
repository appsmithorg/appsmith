# Runs with APPSMITH_SERVER_TIMEOUT unset: the proxy puts no timeout on the
# backend, so a 4 s upstream still answers.
GET http://local.com/api/v1/__slow?delay=4000
HTTP 200
[Asserts]
duration >= 3900
