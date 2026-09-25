# Public API conventions

Status: adopted in Phase 0 (APP-16030). Every public endpoint added in Phases 1 to 9 follows this
document. Change it only through a reviewed PR to this file; a phase design document may add detail
but may not contradict it. Items marked **proposed** are forward commitments that the owning phase
confirms or amends before implementing them; everything else is adopted.

Scope: the supported platform API. The internal `/api/v1` routes and the MCP server keep their
current behaviour and are outside this contract.

## 1. Base path and versioning

- Base path: `/api/public/v1`. It sits under `/api/` so the standard Caddy configuration proxies it
  unchanged, and it is distinct from the internal `/api/v1` so the two have separate security filter
  chains (section 10), rate limits and lifecycles. `SecurityConfig` has no rule for it today, so it
  falls to `authenticated()` until Phase 1 registers its own chain.
- The major version is in the path. Within a major version, changes are additive only: new endpoints,
  new optional request fields, new response fields, new query parameters. Clients must ignore response
  fields they do not know.
- Removing or renaming a field, changing a type, tightening validation, or changing the meaning of a
  status code is a breaking change and needs a new major version.
- Deprecation: mark the operation `deprecated: true` in OpenAPI and send `Deprecation` and `Sunset`
  headers on every response. The `Sunset` date is at least six months after the deprecation is
  announced in the changelog, and the operation keeps working until that date. **Proposed:** the
  six-month minimum is a product commitment; Product confirms the number in Phase 1.

## 2. Requests and responses

- JSON only, UTF-8, `Content-Type: application/json`. Field names are camelCase. Timestamps are
  RFC 3339 in UTC (`2026-09-25T20:15:31Z`). IDs are opaque strings; do not parse them.
- Status codes: `200` for reads and updates, `201` with a `Location` header for creates, `202` for
  accepted long-running work (section 8), `204` for deletes. `Location` values are relative paths,
  never built from the `Host` or `X-Forwarded-Host` header.
- A single resource is returned as the object itself. A collection is returned as
  `{"items": [...], "nextCursor": "..."}` where `nextCursor` is `null` on the last page. The internal
  `ResponseDTO` envelope (`responseMeta` + `data`) is not used on the public path.
- Every response carries `X-Request-Id`. If the client sends one that is at most 64 characters of
  `[A-Za-z0-9._-]`, it is echoed; otherwise the server generates one. `MDCFilter` already reads this
  header (`REQUEST_ID_HEADER`); Phase 1 extends it to generate and echo rather than adding a filter.
- Every response carries `Cache-Control: no-store`. Booleans are `true` or `false`, never absent to
  mean false.

## 3. Errors

Every non-2xx response has this body and nothing else:

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Application not found.",
    "details": [{"field": "name", "reason": "must not be blank"}],
    "requestId": "9d0c1f2e-..."
  }
}
```

- `code` is a stable snake_case identifier listed in the operation's OpenAPI description. Clients
  branch on `code`, never on `message`. The internal `AE-XXX-NNNN` codes from `AppsmithErrorCode`
  never appear on the public path; a package-scoped `@RestControllerAdvice` for the public controllers
  maps `AppsmithException` and validation failures to the table below, ahead of `GlobalExceptionHandler`.
- `details` is optional and only present for validation failures.
- `message` never contains stack traces, class names, datasource URLs or secrets.

| Status | `code` | When |
|---|---|---|
| 400 | `validation_failed` | Malformed body, unknown query parameter, invalid field value |
| 401 | `unauthenticated` | Missing, expired or revoked credential, or a credential type this path does not accept |
| 403 | `forbidden` | Caller may see the resource but not perform this operation |
| 403 | `requires_license` | The operation exists but this edition or license does not include it |
| 404 | `resource_not_found` | Resource missing, or caller has no permission to know it exists |
| 409 | `conflict` | State conflict such as a duplicate name, or an idempotent request still in flight |
| 412 | `precondition_failed` | `expectedRevision` or branch selector does not match (section 9) |
| 422 | `idempotency_key_reuse` | Same `Idempotency-Key` with a different request body (section 6) |
| 429 | `rate_limited` | Limit exceeded; `Retry-After` is set |
| 500 | `internal_error` | Unexpected failure; `requestId` identifies it in server logs |

Anti-enumeration: a resource the caller is not allowed to see and a resource that does not exist
produce responses with identical status, `code`, `message` and header set (only `requestId` differs).
Return `403 forbidden` only when the caller already has read access to the resource. Checks run in
this order so that no later check becomes an existence oracle: `401`, `429`, `400` (syntactic),
`403 requires_license`, `404` (visibility), `403 forbidden`, `412`, `409`.

`requires_license` is enforced server-side on every request from the organization's validated
entitlement, re-evaluated on downgrade or expiry; omitting a licensed operation from the document or
the UI never substitutes for the check.

## 4. Pagination, filtering and sorting

- Collections are cursor-paginated. `limit` defaults to 50 and is capped at 200; `cursor` is the
  opaque value from the previous page's `nextCursor`. Offset pagination is not offered.
- Cursors are server-issued handles or HMAC-signed values; a tampered cursor is `400`. Every page
  re-applies the caller's organization and permission filters; a cursor does not carry authorization.
  A cursor presented with a different filter or sort than the one it was issued for is
  `400 validation_failed`.
- Ordering is stable: the documented sort key with the resource ID as the tie-breaker. `sort=field`
  sorts ascending, `sort=-field` descending; only documented fields are sortable.
- Filters are named query parameters listed per operation (`workspaceId=`, `updatedAfter=`). An
  unknown query parameter is a `400 validation_failed`, not silently ignored.

## 5. Rate limits

- Limits apply per credential (per client IP for unauthenticated calls, taken only from the trusted
  local proxy's `X-Forwarded-For`) and are enforced at the base path, independently of the internal
  API. `401` responses count against the per-IP bucket. The implementation base is the existing
  `RateLimitServiceCEImpl` (bucket4j).
- Every response carries `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`. A rejected
  call returns `429 rate_limited` with `Retry-After` in seconds.
- Default limit values and any per-organization override are set in Phase 1 with the credential
  model; this document fixes only the headers and the error.

## 6. Idempotency and retries

- Every `POST` that creates a resource or starts work accepts an `Idempotency-Key` header (a
  client-generated UUID). The key is scoped to the calling credential, the method and the route: a
  stored response is replayed only to the credential that produced it, and the same key from another
  credential is a fresh request. A repeat with the same key and the same body within 24 hours returns
  the original response without repeating the side effect. The same key with a different body is a
  `422 idempotency_key_reuse`. The same key while the original request is still in flight is a
  `409 conflict`; the client retries after the original completes.
- Stored responses are sensitive: bounded TTL (24 hours), bounded size, and a per-credential quota so
  the store cannot be exhausted.
- `PUT` and `DELETE` are idempotent by definition; a repeated `DELETE` of a missing resource is
  `404`.
- Clients retry only on `429`, `502`, `503` and `504`, with exponential backoff, and always resend
  the same `Idempotency-Key`.

## 7. Side-effect disclosure

- `GET` and `HEAD` never change state, never trigger a Git fetch or pull, and never publish.
- Every mutating operation's OpenAPI description contains a line starting with `Side effects:` that
  names what happens beyond the resource itself: remote Git pushes or fetches, discarded local
  changes, emails, license checks, cache invalidation, or "none".
- No public operation wraps an internal endpoint blindly. Each public resource has its own request
  and response model that omits editor internals, and a test that pins the shape. The following never
  appear in a public model: `policies`, `userPermissions`, datasource `authentication` objects, Git
  remote URLs or keys, and any field marked `@Encrypted` or `Views.Internal`.

## 8. Long-running operations

- Import, export, deploy, Git synchronization and any other operation that may take longer than a
  few seconds returns `202` with a `Location` header pointing at
  `/api/public/v1/operations/{operationId}` and this body:

  ```json
  {"operationId": "op_...", "status": "queued", "statusUrl": "/api/public/v1/operations/op_..."}
  ```

- `status` is one of `queued`, `running`, `succeeded`, `failed`, `cancelled`. A finished operation
  carries `result` (on success) or `error` (section 3 shape). Acceptance is never completion.
- Operation IDs are unguessable (at least 128 bits of entropy) and organization-scoped; an operation
  from another organization is the same `404` as a missing one.
- Reading or cancelling an operation requires the permission the operation itself required,
  re-evaluated at poll time, because `result` can carry export bundles and ID remaps that read access
  to the target alone would not grant. Records are kept for at least 24 hours.
- `DELETE /operations/{operationId}` requests best-effort cancellation and returns `202`; a finished
  operation cannot be cancelled and returns `409 conflict`.

## 9. Organizations, workspaces, branches and IDs

Resource hierarchy: organization, workspace, application, then pages, actions and JS objects.
Datasources and datasource environments belong to the workspace.

- One base URL per installation. Collections that span organizations are addressed explicitly:
  `/organizations/{organizationId}/workspaces`. Globally unique resources are addressed by their own
  ID: `/applications/{applicationId}`. The server resolves the owning organization from the resource
  and checks the credential's grants; a caller-supplied organization never widens authorization.
- If the organization derived from the host, the organization selected in the path and the
  organization that owns the resource disagree, the response is the same `404` as a missing resource.
- `applicationId` in a public URL is always the base application ID, never a branch-specific ID.
  Git-aware operations take `ref` (a branch or tag name) and `refType` (`branch` or `tag`); reads
  also take `mode` (`draft` or `published`). A stale or ambiguous selector is `412 precondition_failed`;
  the server never falls back to the default branch silently.
- **Proposed:** a write to a Git-connected application requires `ref` and `expectedRevision`, and the
  response reports `{"baseId", "branchId", "ref", "revision"}`. No server-side revision concept exists
  today (the Git model is base ID, branch-specific ID and branch name); Phase 5 defines what
  `revision` is before any write endpoint depends on it. Applications without Git omit both fields.
- Clone and import return the ID remapping they performed, so a client can relate the new resources
  to the source.

## 10. Authentication, sessions and audit

- The public base path is served by its own stateless `SecurityWebFilterChain`: bearer credentials in
  the `Authorization` header only; cookies on the request are ignored; `httpBasic`, `formLogin`,
  OAuth2 login and the anonymous principal are disabled on this chain. It is excluded from
  `CsrfConfigCE` because no cookie session can reach it, and it does not accept `X-Requested-By` or
  `X-Appsmith-Version` as substitutes for a credential. CORS is denied.
- Credentials never travel in the URL, a cookie or the body. Phase 1 defines issuance, scopes and
  lifecycle; its baseline is fixed here: tokens are hashed at rest with a scannable prefix, a token's
  effective access is the intersection of its grants and its principal's current permissions
  re-evaluated on every request, a disabled principal or revoked token is `401` immediately, and every
  token is bound to explicitly granted organizations.
- The internal `/api/v1` chain rejects platform credentials with `401 unauthenticated`; a public
  credential never becomes a session for the internal API, and a session never authenticates the
  public path.
- Every call is attributed to the principal and the individual credential that made it. In EE that is
  the audit log; in CE it is a structured server log line carrying the same principal and credential
  IDs. The attribution is written before the response is sent so a client abort cannot suppress it.
  Credentials never appear in logs, exports or audit payloads.

## 11. OpenAPI

- The document is generated from code in the default test run (see `README.md`) and is the reference
  for the contract. Every public operation has a summary, an `operationId`, request and response
  schemas, the list of `code` values it can return, and the `Side effects:` line.
- Public operations are tagged `public`. Operations from the internal API are excluded from the
  public document, and only the `public`-tagged subset is ever republished outside the repository.
