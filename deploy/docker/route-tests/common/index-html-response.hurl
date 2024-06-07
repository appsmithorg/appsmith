GET http://localhost
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Security-Policy: frame-ancestors {{frame_ancestors}}
[Asserts]
header "Server" not exists
body == "actual index.html body"

GET http://127.0.0.1
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Security-Policy: frame-ancestors {{frame_ancestors}}
[Asserts]
header "Server" not exists
body == "actual index.html body"

GET http://local.com
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Security-Policy: frame-ancestors {{frame_ancestors}}
[Asserts]
header "Server" not exists
body == "actual index.html body"

GET http://localhost/some/non/handled/path
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Security-Policy: frame-ancestors {{frame_ancestors}}
[Asserts]
header "Server" not exists
body == "actual index.html body"

GET http://127.0.0.1/some/non/handled/path
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Security-Policy: frame-ancestors {{frame_ancestors}}
[Asserts]
header "Server" not exists
body == "actual index.html body"

GET http://local.com/some/non/handled/path
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Security-Policy: frame-ancestors {{frame_ancestors}}
[Asserts]
header "Server" not exists
body == "actual index.html body"
