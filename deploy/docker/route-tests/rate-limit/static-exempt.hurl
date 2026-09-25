# Runs with APPSMITH_RATE_LIMIT=5. Hashed bundle assets under /static/ are not
# counted against the per-client-IP zone, so far more than 5 succeed from one
# client within a single window.
GET http://local.com/static/test-encoding.txt
[Options]
repeat: 20
HTTP 200

# Backend paths are counted: 5 pass, the 6th in the same window is rejected.
GET http://local.com/api/v1/rate-limit-probe
[Options]
repeat: 5
HTTP 200

GET http://local.com/api/v1/rate-limit-probe
HTTP 429
[Asserts]
header "Retry-After" exists
