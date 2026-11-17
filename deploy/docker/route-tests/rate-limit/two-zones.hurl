# Runs with APPSMITH_RATE_LIMIT=5: backend paths allow 5 per second per client
# IP, hashed bundle assets under /static/ allow ten times that (50). The two
# zones count independently.
GET http://local.com/static/test-encoding.txt
[Options]
repeat: 50
HTTP 200

GET http://local.com/static/test-encoding.txt
HTTP 429
[Asserts]
header "Retry-After" exists

GET http://local.com/api/v1/rate-limit-probe
[Options]
repeat: 5
HTTP 200

GET http://local.com/api/v1/rate-limit-probe
HTTP 429
[Asserts]
header "Retry-After" exists
