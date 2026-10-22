# Runs with APPSMITH_SERVER_TIMEOUT=2: backend requests that take longer than
# 2 s to send response headers get a 504.
GET http://local.com/api/v1/__slow?delay=4000
HTTP 504
[Asserts]
duration >= 1900
duration < 3500

# A backend request under the cap is unaffected.
GET http://local.com/api/v1/__slow?delay=100
HTTP 200

# Real-time traffic is not capped.
GET http://local.com/rts/__slow?delay=4000
HTTP 200
[Asserts]
duration >= 3900
