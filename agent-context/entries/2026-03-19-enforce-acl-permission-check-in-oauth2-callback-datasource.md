---
schema: v1
date: 2026-03-19
type: bug-fix
area: backend/services/authentication
trigger: Security review revealed that the OAuth2 callback endpoint accepted a client-controlled datasource ID from the state parameter without enforcing ACL, allowing any authenticated user to initiate token exchange against datasources they do not own.
sources:
  - type: pull-request
    url: https://github.com/appsmithorg/appsmith/pull/41638
  - type: linear
    id: APP-15028
---

## Root Cause

`AuthenticationServiceCEImpl.getAccessTokenForGenericOAuth2` parsed the datasource ID directly from the OAuth2 `state` query parameter (a comma-delimited string, `splitStates[1]`) and passed it to the **one-argument** `datasourceService.findById(id)` overload, which performs no ACL check.

Because the `state` parameter is constructed client-side during the authorization initiation and echoed back by the OAuth provider, a malicious authenticated user could substitute any datasource ID they wished into the state value. The callback handler would then look up — and proceed to write OAuth2 tokens to — an arbitrary datasource, bypassing all workspace-level access controls.

The three other `findById` call sites in the same class (`getAuthorizationCodeURLForGenericOAuth2` at line ~120, `getAppsmithToken` at line ~402, and `getAccessTokenFromCloud` at line ~586) all use the two-argument overload `findById(id, datasourcePermission.getEditPermission())`, making the omission in `getAccessTokenForGenericOAuth2` a clear inconsistency rather than an intentional design decision.

**Vulnerable code (before fix):**
```java
return datasourceService
        .findById(splitStates[1])          // no ACL — open to ID substitution
        .flatMap(datasource1 -> datasourceStorageService.findByDatasourceAndEnvironmentId(
                datasource1, splitStates[2]));
```

**Fixed code:**
```java
return datasourceService
        .findById(splitStates[1], datasourcePermission.getEditPermission())   // enforces MANAGE_DATASOURCES
        .flatMap(datasource1 -> datasourceStorageService.findByDatasourceAndEnvironmentId(
                datasource1, splitStates[2]));
```

The `datasourcePermission` field was already constructor-injected at line 96 and available throughout the class — no new dependencies were required.

## Golden Path

Minimal set of files to understand and reproduce this fix:

| File | Role |
|------|------|
| `app/server/appsmith-server/src/main/java/com/appsmith/server/solutions/ce/AuthenticationServiceCEImpl.java` | Contains the vulnerable `getAccessTokenForGenericOAuth2` method (line ~243), the three reference call sites that already use ACL-guarded `findById`, and the `getPageRedirectUrl` helper (line ~353) whose `switchIfEmpty` fallback was added to handle the page-not-found case |
| `app/server/appsmith-interfaces/src/main/java/com/appsmith/server/datasources/base/DatasourceServiceCE.java` | Declares both `findById` overloads; shows the contract difference between the ACL and non-ACL variants |
| `app/server/appsmith-server/src/test/java/com/appsmith/server/solutions/AuthenticationServiceTest.java` | Integration test class; new tests `testGetAccessTokenForGenericOAuth2_forbiddenDatasource` and `testGetAccessTokenForGenericOAuth2_nonexistentDatasource` verify the ACL rejection path |

## Watch For

- **New OAuth2 / callback-style flows**: Any future method that accepts a resource identifier from a client-controlled input (URL param, request body, cookie, state string) and performs a database lookup on it must use the ACL-guarded overload. The one-argument `findById(id)` is only safe for server-initiated lookups where the ID originates from a trusted, already-verified source (e.g. a previously ACL-checked document's field).

- **The no-arg `findById` overload in `DatasourceService`**: Grep for `findById(` usages that pass only one argument. Every occurrence warrants a comment or explicit justification explaining why ACL is not needed at that point. There is no IDE/compiler warning that distinguishes the safe from the unsafe overload.

- **State-parameter parsing across OAuth flows**: The comma-delimited `state` string (`pageId,datasourceId,environmentId,redirectOrigin,...`) is the trust boundary. Any code that splits and uses `splitStates[N]` for a database lookup is a candidate for this class of vulnerability. Each such index access should be traced back to verify the ID has been ACL-checked at some point in the call chain.

- **Regression risk when adding new OAuth2 providers or refactoring `AuthenticationServiceCEImpl`**: The three safe call sites and the one previously unsafe call site all live in the same file. If the method is extracted, split, or duplicated as part of a plugin-specific override, the new code must carry the `datasourcePermission.getEditPermission()` argument — it is easy to omit when copy-pasting only the `findById(...)` line.

- **`DatasourceServiceCE` interface evolution**: If the one-argument `findById(id)` overload is ever removed or deprecated, the compiler will catch all remaining usages. Conversely, if additional no-ACL overloads are introduced (e.g. for internal system jobs), care must be taken to ensure they are not reachable from user-facing code paths.

## Context

- The bug was identified by auditing ACL usage patterns across `AuthenticationServiceCEImpl`. Comparing the callback method against the three already-fixed call sites made the missing argument immediately obvious — a useful heuristic: when a class has multiple similar calls, any one that differs in argument count deserves scrutiny.

- The fix is a one-line change. The `datasourcePermission` dependency was already wired in via constructor injection, so no new Spring beans, interfaces, or configuration were required.

- When `findById` with ACL returns `Mono.empty()` (i.e. the user lacks `MANAGE_DATASOURCES`), the reactive chain propagates through `flatMap` as an empty signal. Because `onErrorResume` only intercepts error signals (not empty completion), the entire `getAccessTokenForGenericOAuth2` chain would have completed empty — silently, with no redirect. To ensure a graceful `appsmith_error` redirect is always produced, `getPageRedirectUrl` was also patched to add a `switchIfEmpty` fallback alongside the pre-existing `onErrorResume` fallback. This makes the private helper robust against both the page-not-found (empty) and page-access-error cases, consistent with the intent of the existing error-handling code.

- Integration tests in `AuthenticationServiceTest` are the standard pattern in this codebase; they run against the full Spring context with real ACL enforcement, making them more reliable than unit tests with mocked repositories for validating permission boundaries.
