GET http://localhost/static/missing
HTTP 404
[Asserts]
header "Server" not exists

GET http://127.0.0.1/static/missing
HTTP 404
[Asserts]
header "Server" not exists

GET http://local.com/static/missing
HTTP 404
[Asserts]
header "Server" not exists
