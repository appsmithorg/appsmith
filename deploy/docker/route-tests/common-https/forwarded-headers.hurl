GET https://custom-domain.com/oauth2/google/authorize
HTTP 200
```
Scheme = 'http'
X-Forwarded-Proto = 'https'
Host = 'custom-domain.com'
X-Forwarded-Host = 'custom-domain.com'
Forwarded = ''
```

# This is the CloudRun test. That the `Forwarded` header should be removed when proxying to upstream.
GET https://custom-domain.com/oauth2/google/authorize
Forwarded: something something
HTTP 200
```
Scheme = 'http'
X-Forwarded-Proto = 'https'
Host = 'custom-domain.com'
X-Forwarded-Host = 'custom-domain.com'
Forwarded = ''
```

GET https://custom-domain.com/oauth2/google/authorize
X-Forwarded-Proto: http
X-Forwarded-Host: overridden.com
HTTP 200
```
Scheme = 'http'
X-Forwarded-Proto = 'http'
Host = 'custom-domain.com'
X-Forwarded-Host = 'overridden.com'
Forwarded = ''
```
