# Assets are served from the instance origin. Caddy must keep the sandbox CSP the backend sends for them, so a stored
# SVG opened directly can't run script, while still applying frame-ancestors.
GET http://local.com/api/v1/assets/some-asset-id
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors {{frame_ancestors}}; sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'"
header "X-Content-Type-Options" == "nosniff"
header "Server" not exists

# Other backend responses keep the plain frame-ancestors policy.
GET http://local.com/api/v1/users/me
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors {{frame_ancestors}}"
header "X-Content-Type-Options" == "nosniff"
