# Appsmith Login Process — Security Review

## Executive Summary

In-depth security review of the Appsmith login process across the full stack: client-side React/Redux, server-side Spring Security WebFlux, session management (Redis), reverse proxy (Caddy), and supporting flows (OAuth2, password reset, CSRF). Findings organized by severity.

---

## CRITICAL / HIGH Severity

### 1. Password Reset Poisoning via Host Header Injection
**File:** `app/server/.../services/ce/UserServiceCEImpl.java:132-146`

When `APPSMITH_BASE_URL` is **not set** (the default for most self-hosted instances), the password reset email link is constructed using the client-provided `Origin` header:

```java
protected Mono<String> resolveSecureBaseUrl(String providedBaseUrl) {
    if (!StringUtils.hasText(appsmithBaseUrl)) {
        return Mono.just(providedBaseUrl);  // trusts client-provided URL
    }
}
```

**Attack:** An attacker sends `POST /api/v1/users/forgotPassword` with `Origin: https://attacker.com`. The victim receives a password reset email where the link points to `https://attacker.com/user/resetPassword?token=...`. When clicked, the encrypted reset token is sent to the attacker's server.

**Impact:** Full account takeover via token theft.
**Mitigation:** Always configure `APPSMITH_BASE_URL`. Better: hardcode or validate the base URL server-side rather than trusting request headers.

---

### 2. Session Cookie Missing `HttpOnly` and `Secure` Flags
**File:** `app/server/.../configurations/ce/CustomCookieWebSessionIdResolverCE.java`

```java
this.setCookieMaxAge(Duration.of(30, DAYS));
this.addCookieInitializer((builder) -> builder.path("/"));
this.addCookieInitializer((builder) -> builder.sameSite(LAX));
// No .httpOnly(true) — No .secure(true)
```

The SESSION cookie is **not** marked `HttpOnly`, meaning JavaScript can read it via `document.cookie`. It is also **not** marked `Secure`, so it can be transmitted over plain HTTP.

**Impact:** Any XSS vulnerability allows session theft. Without `Secure`, sessions can be intercepted on non-HTTPS connections.

---

### 3. No HSTS (HTTP Strict Transport Security) Configured
**Location:** Not present in Caddy config (`caddy-reconfigure.mjs`) or Spring Security

HSTS is not set anywhere. Even with TLS enabled via custom domain, browsers will not pin the HTTPS connection.

**Impact:** Users are vulnerable to SSL stripping and protocol downgrade attacks (e.g., via a malicious Wi-Fi hotspot).

---

### 4. Default `frame-ancestors` Allows All Origins
**File:** `deploy/docker/fs/opt/appsmith/docker.env.sh`

The default Content-Security-Policy is `frame-ancestors 'self' *`, which allows **any website** to embed Appsmith in an iframe.

**Impact:** Clickjacking attacks — a malicious site can overlay transparent Appsmith iframes to trick users into performing actions (e.g., adding the attacker as admin).

---

### 5. Session Token Transmitted in URL Query String
**File:** `app/client/src/utils/SessionUtils.ts:19-61`

Cross-domain session transfer passes session tokens and CSRF tokens as URL query parameters:

```typescript
const sessionToken = urlParams.get("sessionToken");
const validationUrl = `v1/session/validate?${validationParams.toString()}`;
```

**Impact:** Tokens leak via browser history, server logs, proxy logs, `Referer` headers, and bookmarks.

---

## MEDIUM Severity

### 6. No Session Fixation Protection
**File:** `app/server/.../configurations/SecurityConfig.java`

Spring Security WebFlux does not provide automatic session fixation protection. After successful login, the same session ID is reused — no `changeSessionId()` is called.

**Attack:** An attacker plants a known session cookie in the victim's browser (e.g., via a subdomain cookie or network MITM). After the victim logs in, the attacker's pre-set session ID is now authenticated.

---

### 7. Rate Limiting is Per-Username Only, Not Per-IP
**File:** `app/server/.../filters/LoginRateLimitFilter.java`, `RateLimitConfig.java`

Login rate limiting uses Bucket4j with Redis: **5 attempts per 24 hours per username**. There is no IP-based rate limiting at the application layer.

**Attack vectors:**
- **Credential stuffing across many accounts:** An attacker trying one password against 10,000 accounts is not rate-limited (each account gets 5 attempts)
- **Account lockout DoS:** An attacker can lock out any known email by sending 5 bad passwords, suspending the legitimate user for 24 hours

---

### 8. `X-Forwarded-For` Trusted from All Sources
**Files:** `caddy-reconfigure.mjs` (`trusted_proxies static 0.0.0.0/0`), `application-ce.properties` (`server.forward-headers-strategy=NATIVE`)

Any client can spoof their IP address by setting the `X-Forwarded-For` header.

**Impact:** Caddy's rate limiting key includes this header, so an attacker can bypass the 100 req/s global rate limit by rotating the `X-Forwarded-For` value.

---

### 9. OAuth Redirect URL Not Validated
**File:** `app/client/src/pages/UserAuth/ThirdPartyAuth.tsx:43-46`

```tsx
let url = props.url;
const redirectUrl = queryParams.get("redirectUrl");
if (redirectUrl != null) {
  url += `?redirectUrl=${encodeURIComponent(redirectUrl)}`;
}
// No call to getIsSafeRedirectURL() — compare with Login.tsx which DOES validate
```

The `redirectUrl` parameter is appended to the OAuth authorization URL without validation. The standard login form (`Login.tsx:153`) calls `getIsSafeRedirectURL()` but the OAuth flow does not.

**Impact:** Open redirect after OAuth callback if the server also does not re-validate.

---

### 10. Email Enumeration via Rate-Limit Response Differential
**File:** `app/server/.../controllers/ce/UserControllerCE.java:95-99`, `UserServiceCEImpl.java:311`

The forgot-password endpoint returns HTTP 200 for all requests to prevent enumeration. However, after 3 requests for a **valid** email, it throws `TOO_MANY_REQUESTS` (HTTP 429). A non-existent email always returns 200.

**Attack:** Send 4 forgot-password requests for a target email. If the 4th returns 429, the email exists. If it returns 200, it does not.

---

### 11. Empty Actuator Password Accepted by Default
**File:** `SecurityConfig.java:157-175`, `application-ce.properties`

If `APPSMITH_INTERNAL_PASSWORD` is empty (the default), the actuator HTTP Basic check compares `"".equals(credentials)` — empty credentials authenticate successfully.

**Impact:** Unauthenticated access to Spring Actuator endpoints (`/actuator/**`), potentially exposing health, metrics, environment, heap dumps, etc.

---

### 12. No Application-Level Password Reset Token TTL Check
**File:** `UserServiceCEImpl.java`

Password reset tokens rely solely on MongoDB's TTL index (48-hour expiry). There is no application-level timestamp check in `verifyPasswordResetToken()` or `resetPasswordAfterForgotPassword()`.

**Impact:** MongoDB TTL cleanup runs approximately every 60 seconds and can be delayed under load, creating a window where expired tokens are still valid.

---

### 13. CSRF Protection Heavily Relaxed
**File:** `app/server/.../configurations/ce/CsrfConfigCE.java`

CSRF is bypassed for:
- Any request with `Content-Type: application/json`
- Any request with `X-Appsmith-Version` header
- Any request with `X-Requested-By: Appsmith` header

This relies on the assumption that browsers prevent cross-origin requests with these headers. While generally true for modern browsers with CORS preflight, the breadth of exemptions increases risk.

---

### 14. Debug Logging of Password Reset Tokens
**File:** `UserServiceCEImpl.java:276,287`

```java
log.debug("Password reset Token: {} for email: {}", token, passwordResetToken.getEmail());
log.debug("Password reset url for email: {}: {}", passwordResetToken.getEmail(), resetUrl);
```

If debug logging is enabled in production, raw reset tokens and full reset URLs appear in server logs.

---

## LOW Severity

### 15. `window.parent.postMessage` with `"*"` Origin
**File:** `app/client/src/pages/UserAuth/Login.tsx:128-134`

The login page broadcasts `APPSMITH_AUTH_REQUIRED` to any parent frame with no origin restriction.

---

### 16. Client-Side Password Validation Weaker Than Server
**File:** `app/client/src/utils/formhelpers.ts:12-19`

Client-side `isStrongPassword()` checks only length (8-48 chars). The server can enforce uppercase, lowercase, digit, and special character requirements. Users experience a confusing rejection after client-side "pass."

---

### 17. No Password History Enforcement
Users can reset their password to the same previous password. No history check exists.

---

### 18. No CAPTCHA on Login Form
reCAPTCHA keys exist in configuration (`APPSMITH_RECAPTCHA_SITE_KEY`) but are used only for user invites, not the login form. Combined with the per-username (not per-IP) rate limiting, this enables automated credential stuffing.

---

### 19. 30-Day Session Cookie with No Re-authentication
**File:** `RedisConfig.java` — `maxInactiveIntervalInSeconds = 2592000` (30 days)

Sessions persist for 30 days with no re-authentication requirement for sensitive operations.

---

### 20. 150MB Request Body Limit
**File:** `application-ce.properties`

`spring.codec.max-in-memory-size=150MB` allows very large request bodies, creating memory exhaustion risk.

---

### 21. `hashPassword` Function is Misleading No-Op
**File:** `app/client/src/utils/formhelpers.ts:4-6`

```typescript
export const hashPassword = (password: string) => {
  return password;  // identity function, does nothing
};
```

---

## Positive Findings (Things Done Well)

| Area | Implementation |
|---|---|
| Password storage | BCrypt (cost 10) — industry standard |
| Reset token storage | BCrypt-hashed in MongoDB, never stored raw |
| Reset token in URL | AES-256 encrypted before embedding in link |
| Session invalidation after reset | All sessions logged out, rate limit counter reset |
| Open redirect protection | Comprehensive `RedirectHelper.sanitizeRedirectUrl()` |
| SSRF protection | Blocks cloud metadata IPs, DNS rebinding prevention |
| OAuth2 security | PKCE (S256), nonce for OIDC, domain restriction support |
| Email enumeration prevention | Forgot-password always returns 200 (though with the 429 differential gap) |
| Request ID sanitization | Caddy validates/replaces `X-Request-Id` header format |
| Error message approved-list | `getSafeErrorMessage()` prevents arbitrary message reflection |

---

## Recommended Priorities

1. **Immediately:** Set `APPSMITH_BASE_URL` in all deployments; add `HttpOnly` and `Secure` flags to session cookie; set `APPSMITH_INTERNAL_PASSWORD`
2. **Short-term:** Add HSTS header; restrict default `frame-ancestors`; add IP-based rate limiting; add session fixation protection
3. **Medium-term:** Validate OAuth `redirectUrl`; add CAPTCHA to login; unify password validation; add application-level token TTL check; restrict trusted proxies
4. **Long-term:** Implement full CSP; add password history; consider reducing session lifetime; upgrade BCrypt cost factor or migrate to Argon2
