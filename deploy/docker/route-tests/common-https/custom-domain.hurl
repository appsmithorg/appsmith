GET http://custom-domain.com
HTTP 302
Location: https://custom-domain.com/
Connection: close
[Asserts]
header "Server" not exists

GET http://custom-domain.com/random/path
HTTP 302
Location: https://custom-domain.com/random/path
Connection: close
[Asserts]
header "Server" not exists

GET https://custom-domain.com
HTTP 200
[Asserts]
header "Server" not exists
certificate "Issuer" contains "{{ca_issuer}}"

GET https://custom-domain.com/random/path
HTTP 200
[Asserts]
header "Server" not exists

GET https://custom-domain.com/static/x
HTTP 404
[Asserts]
header "Server" not exists
