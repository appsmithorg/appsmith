# Pylon Chat Identity Verification

**Date:** 2026-04-08
**Branch:** `feat/change-intercom-to-pylon`
**Pylon docs:** https://docs.usepylon.com/pylon-docs/chat-widget/identity-verification

## Goal

Enable Pylon chat widget identity verification by computing an HMAC-SHA256 hash
of the authenticated user's email server-side and exposing it to the client so
`window.pylon.chat_settings.email_hash` can be set on boot.

This applies to all non-airgapped deployments (cloud and self-hosted).

## Architecture

```
GitHub Secret APPSMITH_PYLON_IDENTITY_SECRET
        │
        ▼ (CI Docker build arg → ENV in image)
Spring CommonConfig.pylonIdentitySecret
        │
        ▼
PylonIdentityHelper.computeEmailHash(email)   ─┐
        │                                      │ HMAC-SHA256
        ▼                                      │ key = hex-decoded secret
UserServiceCEImpl.buildUserProfileDTO          │ msg = email
        │                                      │
        ▼                                      │
UserProfileDTO.emailVerificationHash  ◀────────┘
        │
        ▼ (existing /v1/users/me + consolidated API)
Frontend User.emailVerificationHash
        │
        ▼
bootPylon() / updatePylonChatIdentity()
        │
        ▼
window.pylon.chat_settings.email_hash
```

## Configuration

| Layer | Name |
|---|---|
| GitHub repo secret | `APPSMITH_PYLON_IDENTITY_SECRET` |
| Docker image env var | `APPSMITH_PYLON_IDENTITY_SECRET` |
| Spring property | `appsmith.pylon.identity-secret` |
| Default | empty string |

When the secret is empty (e.g. local dev or unconfigured installs), the helper
returns `null`, the DTO field is `null`, and the frontend simply omits
`email_hash`. Pylon still works in unverified mode — same as today.

Airgapped installs short-circuit Pylon entirely on the client
(`isPylonChatAvailable()` returns `false`), so the secret being baked into the
image is harmless.

## Backend changes

### `CommonConfig.java`

Add one field:

```java
@Value("${appsmith.pylon.identity-secret:}")
private String pylonIdentitySecret;
```

### `PylonIdentityHelper.java` (new)

Spring `@Component` with one method:

```java
public String computeEmailHash(String email)
```

- Returns `null` if secret or email is blank.
- Returns `null` and logs an error on any cryptographic failure (never throws).
- Uses `org.apache.commons.codec.binary.Hex` (already a transitive dep via
  `commons-codec`, used by `DigestUtils` in `CommonConfig`).
- HMAC-SHA256 with `SecretKeySpec(Hex.decodeHex(secret), "HmacSHA256")`.

### `UserProfileCE_DTO.java`

Add one field:

```java
@JsonProperty("emailVerificationHash")
String emailVerificationHash;
```

### `UserServiceCEImpl.buildUserProfileDTO`

- Inject `PylonIdentityHelper` via constructor.
- After `profile.setIsConfigurable(...)` add:
  ```java
  profile.setEmailVerificationHash(
      pylonIdentityHelper.computeEmailHash(userFromDb.getEmail()));
  ```

### Tests

`PylonIdentityHelperTest.java`:

- Computes a known HMAC-SHA256 against a fixed hex secret + email and asserts
  the expected output.
- Returns `null` when secret is empty.
- Returns `null` when email is empty.
- Returns `null` when secret is not valid hex.

## Frontend changes

### `app/client/src/constants/userConstants.ts`

Add to `User` interface:

```ts
emailVerificationHash?: string;
```

### `app/client/src/ce/configs/index.ts`

Add `email_hash?: string` to the `window.pylon.chat_settings` type.

### `app/client/src/utils/bootPylon.ts`

In both `bootPylon()` and `updatePylonChatIdentity()`, set:

```ts
email_hash: user?.emailVerificationHash,
```

`updatePylonChatIdentity()` should preserve any existing `email_hash` the same
way it already preserves `account_external_id`, so a consent refresh doesn't
drop the verification.

## Out of scope

- Rotating the secret without a redeploy (would require pulling from a remote
  config store; YAGNI).
- Per-tenant secrets (single Pylon workspace; YAGNI).
- Verifying hash on the Java side beyond unit tests (Pylon does the
  verification on their end).

## Trust model note

The same secret is baked into every released Docker image, so a motivated user
with shell access to any Appsmith install can extract it and forge `email_hash`
values for arbitrary emails inside the shared Pylon workspace. This is
consistent with the prior Intercom setup and accepted as a known limitation.
