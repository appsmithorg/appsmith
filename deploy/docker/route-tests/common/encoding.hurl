# Verify on-the-fly compression when the client requests it.

# gzip encoding
GET http://localhost/static/test-encoding.txt
Accept-Encoding: gzip
HTTP 200
[Asserts]
header "Content-Encoding" == "gzip"

# zstd encoding
GET http://localhost/static/test-encoding.txt
Accept-Encoding: zstd
HTTP 200
[Asserts]
header "Content-Encoding" == "zstd"

# No encoding requested, no encoding applied
GET http://localhost/static/test-encoding.txt
HTTP 200
[Asserts]
header "Content-Encoding" not exists
