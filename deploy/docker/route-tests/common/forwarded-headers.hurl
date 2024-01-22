GET http://local.com/oauth2/google/authorize
HTTP 200
```
Scheme = 'http'
X-Forwarded-Proto = 'http'
Host = 'local.com'
X-Forwarded-Host = 'local.com'
Forwarded = ''
```

# This is the CloudRun test. That the `Forwarded` header should be removed when proxying to upstream.
GET http://local.com/oauth2/google/authorize
Forwarded: something something
HTTP 200
```
Scheme = 'http'
X-Forwarded-Proto = 'http'
Host = 'local.com'
X-Forwarded-Host = 'local.com'
Forwarded = ''
```

GET http://local.com/oauth2/google/authorize
X-Forwarded-Proto: https
X-Forwarded-Host: overridden.com
HTTP 200
```
Scheme = 'http'
X-Forwarded-Proto = 'https'
Host = 'local.com'
X-Forwarded-Host = 'overridden.com'
Forwarded = ''
```
