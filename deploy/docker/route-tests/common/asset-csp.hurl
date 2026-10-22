# Uploaded images (assets and profile photos) are served from the instance origin. Caddy sets the sandbox CSP for
# these routes itself and replaces whatever the backend sent, so a stored SVG opened directly can't run script. The
# echo upstream sends a weaker `default-src 'self'` policy on these routes to prove it is replaced, not merged.
GET http://local.com/api/v1/assets/some-asset-id
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors {{frame_ancestors}}; sandbox; default-src 'none'; style-src 'unsafe-inline'"
header "Content-Security-Policy" not contains "default-src 'self'"
header "X-Content-Type-Options" == "nosniff"
header "Server" not exists

GET http://local.com/api/v1/users/photo
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors {{frame_ancestors}}; sandbox; default-src 'none'; style-src 'unsafe-inline'"
header "Content-Security-Policy" not contains "default-src 'self'"
header "X-Content-Type-Options" == "nosniff"

GET http://local.com/api/v1/users/photo/someone@example.com
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors {{frame_ancestors}}; sandbox; default-src 'none'; style-src 'unsafe-inline'"
header "Content-Security-Policy" not contains "default-src 'self'"
header "X-Content-Type-Options" == "nosniff"

# Other backend responses keep the plain frame-ancestors policy.
GET http://local.com/api/v1/users/me
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors {{frame_ancestors}}"
header "X-Content-Type-Options" == "nosniff"
