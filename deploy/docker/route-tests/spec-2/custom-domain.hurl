GET http://custom-domain.com
HTTP 302
Location: https://custom-domain.com/
[Asserts]
header "Server" not exists

GET http://custom-domain.com/random/path
HTTP 302
Location: https://custom-domain.com/random/path
[Asserts]
header "Server" not exists

GET https://custom-domain.com
HTTP 200
[Asserts]
header "Server" not exists
certificate "Issuer" == "CN = Caddy Local Authority - ECC Intermediate"

GET https://custom-domain.com/random/path
HTTP 200
[Asserts]
header "Server" not exists
#certificate "Issuer" == "CN = Caddy Local Authority - ECC Intermediate"

GET https://custom-domain.com/static/x
HTTP 404
[Asserts]
header "Server" not exists
#certificate "Issuer" == "CN = Caddy Local Authority - ECC Intermediate"
