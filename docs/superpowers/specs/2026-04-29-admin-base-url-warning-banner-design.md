# Admin Warning Banner for Unset `APPSMITH_BASE_URL` (GHSA-j9gf-vw2f-9hrw follow-up)

**Date:** 2026-04-29
**Author:** subrata71
**Companion to:** [PR #41766](https://github.com/appsmithorg/appsmith/pull/41766) (CE), [PR #8997](https://github.com/appsmithorg/appsmith-ee/pull/8997) (EE) — the GHSA-j9gf-vw2f-9hrw fail-closed fix
**Linear:** [APP-15046](https://linear.app/appsmith/issue/APP-15046)

## Context

The fix for [GHSA-j9gf-vw2f-9hrw](https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw) makes the server fail-closed for token-bearing email flows (forgot-password, email verification, workspace invite, instance-admin invite) whenever `APPSMITH_BASE_URL` is unset. That is the security-correct default, but operationally it creates a silent-degradation surface: a self-hosted instance admin who upgrades without setting `APPSMITH_BASE_URL` will not realise their instance is misconfigured until end-users complain that password-reset and verification emails never arrive.

The reporter's own recommendation (verbatim, item 3 in the GHSA discussion) was:

> "If APPSMITH_BASE_URL is unset, fail closed in the email-generation path. ... Emit clear server log + **admin warning** + health/configuration signal that token-bearing email flows are disabled until APPSMITH_BASE_URL is configured."

The server-log piece already exists (a WARN log on every resolver call). This document covers the **admin warning** piece — an in-product banner shown only to instance admins when the server is in this fail-closed state.

## Goal

Show a non-dismissible warning banner at the top of the application to logged-in instance admins (super users with admin-settings access) **only** when:

- The instance is in CE, OR
- The instance is in EE with the `license_multi_org_enabled` feature flag **off**, AND
- `APPSMITH_BASE_URL` is unset.

The banner explains that token-bearing email flows are disabled and deep-links to Admin Settings → Configuration where the admin can set the value. Saving the value triggers Appsmith's existing Configuration-tier server-restart flow, which auto-reloads the SPA and the banner disappears (because the resolver re-reads the env on startup).

## Non-goals (v1)

- **Insecure-flag-on warning.** When `APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS=true`, the banner does **not** fire even though the deployment is insecure. That is a separate decision with different copy and stronger language; deferred.
- **EE multi-org.** Multi-org EE instances (Appsmith Cloud) derive their email-link host from `organizationService.getOrganizationBaseUrl()` (slug + deploymentDomain) and do not depend on `APPSMITH_BASE_URL`. The banner must **never** appear there.
- **Per-user dismissal / snooze / reminder cadence.** The banner reflects live server state. The misconfig itself is the source of truth — clear the misconfig, the banner clears.
- **Audit log entry** when banner displays.
- **Severity escalation** if the admin keeps ignoring the banner.

## Architecture

### Signal source — extend the existing resolver

`SecureBaseUrlResolverCE` already centralises the question "what canonical host should this instance use for email links?". It is the natural place to ask "is that question well-formed for this instance?". Add one new reactive method:

```java
Mono<Boolean> isBaseUrlConfigurationHealthy();
```

Semantics: *"can this instance generate token-bearing email links without depending on a request-time hint?"* True ⇒ no banner. False ⇒ banner.

| Implementation | Returns |
|---|---|
| `SecureBaseUrlResolverCEImpl` (CE) | `Mono.just(StringUtils.hasText(appsmithBaseUrl))` |
| `SecureBaseUrlResolverImpl` (EE override) | If `featureFlagService.check(license_multi_org_enabled)` is true → `Mono.just(true)`; else → `super.isBaseUrlConfigurationHealthy()` |

The EE override mirrors the same `featureFlagService.check(...).flatMap(...)` shape that already exists for `resolveSecureBaseUrl`, so the two methods stay symmetrical.

The method is reactive because the EE override needs the feature flag service. The DTO assembler (`UserServiceCEImpl#buildUserProfile`) is already a reactive chain, so this folds in via a single `.zipWith(...)` step.

### Signal pathway — ride on `UserProfileCE_DTO`

`UserProfileCE_DTO` already carries instance-state signals (`isEmptyInstance`, `isSuperUser`, `adminSettingsVisible`) that the React client uses for gating. Add one boolean field:

```java
@JsonProperty("instanceBaseUrlConfigurationHealthy")
boolean instanceBaseUrlConfigurationHealthy = true;
```

Default `true` — any DTO instance that bypasses the real assembler (test fixtures, mock contexts, future code paths) behaves as "configured" and does not false-positive the banner.

`UserServiceCEImpl#buildUserProfileDTO(User)` injects the resolver and calls `isBaseUrlConfigurationHealthy()` as part of the existing reactive build chain. No new endpoint, no new saga, no new Redux state.

### Client — dedicated banner component

A new component `BaseUrlMissingBanner.tsx` lives at `app/client/src/components/editorComponents/`. It uses `Callout` from `@appsmith/ads` (`kind="warning"`), is rendered at the top of the application above `AppHeader`, and is **not user-dismissible** (no close button, no `isClosable`). The component returns `null` when the gating selector says so, so it costs nothing for non-admin users.

Layout: rendered as a regular block element at the top of the authed-routes container in `AppRouter.tsx`. Pushes everything below it down by its own height naturally — no body class, no manual offset, no CSS hack. Existing `<ProductAlertBanner />` (bottom-of-screen) coexists fine.

Selector in `selectors/usersSelectors.ts`:

```ts
const getShouldShowBaseUrlMissingBanner = (state: AppState): boolean => {
  const user = state.ui.users.currentUser;
  return Boolean(
    user?.isSuperUser &&
    user?.adminSettingsVisible &&
    user?.instanceBaseUrlConfigurationHealthy === false  // explicit !== !value
  );
};
```

The `=== false` check (rather than `!value`) is deliberate: during a rolling deploy where a newer client briefly sees an older server's response without the field, `undefined === false` is `false`, so the banner stays hidden. Once both sides redeploy, the explicit `false` flips it on.

### CTA — deep-link to the existing Admin Settings field

`APPSMITH_BASE_URL` is already a registered setting in the Admin Settings → Configuration tab (`SettingCategories.CONFIGURATION` / `CategoryType.INSTANCE`, defined at `app/client/src/ce/pages/AdminSettings/config/configuration.tsx`). The banner has one `CalloutLink` whose `to` is built via the existing helper:

```ts
adminSettingsCategoryUrl({ category: SettingCategories.CONFIGURATION })
// → /settings/configuration
```

Same pattern as `AuthPage.tsx` already uses for its own admin-settings deep links.

### Recovery loop (no extra code)

Existing Configuration-tier admin-settings save flow does this naturally — verified by reading `app/client/src/ce/sagas/SuperUserSagas.tsx` (`SaveAdminSettingsSaga` → `RESTART_SERVER_POLL` → `RestartServerPoll` → `RestryRestartServerPoll` → `window.location.reload()`):

```
Admin clicks banner CTA
  → /settings/configuration
  → enters APPSMITH_BASE_URL value, clicks Save
  → SAVE_ADMIN_SETTINGS_SUCCESS  →  RESTART_SERVER_POLL
  → server restarts (Configuration-tier setting → needsRestart = true)
  → client polls fetchCurrentOrganizationConfig until migrationStatus === COMPLETED
  → window.location.reload()
  → Redis-backed session survives  →  no login redirect
  → fresh /v1/users/profile  →  instanceBaseUrlConfigurationHealthy: true
  → selector returns false  →  banner gone
```

The admin sees only the same "Server is restarting…" UX they already know from changing any other Configuration-tier setting (Redis URL, DB URL, etc.). No login screen, no manual refresh.

## Files to change

### Server CE (4 files)

| File | Change |
|---|---|
| `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCE.java` | Add `Mono<Boolean> isBaseUrlConfigurationHealthy();` to the interface. |
| `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImpl.java` | Implement: `return Mono.just(StringUtils.hasText(appsmithBaseUrl));` |
| `app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/ce/UserProfileCE_DTO.java` | Add `boolean instanceBaseUrlConfigurationHealthy = true;` with `@JsonProperty`. |
| `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/UserServiceCEImpl.java` | Inject `SecureBaseUrlResolverCE` and `.zipWith(...)` the resolver call into the existing `buildUserProfileDTO(User)` reactive chain. |

### Server EE (1 file)

| File | Change |
|---|---|
| `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/SecureBaseUrlResolverImpl.java` | Override `isBaseUrlConfigurationHealthy()` with the multi-org gate (mirror the existing `resolveSecureBaseUrl` shape). |

### Client CE (5 files)

| File | Change |
|---|---|
| `app/client/src/components/editorComponents/BaseUrlMissingBanner.tsx` (new) | New component. `Callout kind="warning"`, copy + CTA, returns `null` when gating selector is false. Not closable. |
| `app/client/src/selectors/usersSelectors.ts` | Add `getShouldShowBaseUrlMissingBanner` selector with explicit `=== false` guard. |
| `app/client/src/ce/constants/messages.ts` | Three new message keys: title, body, CTA label. |
| `app/client/src/ce/AppRouter.tsx` | Mount `<BaseUrlMissingBanner />` as the first child of the authed-routes container, above `<AppHeader />`. |
| `app/client/src/reducers/uiReducers/usersReducer.ts` (and any inferred user-profile TypeScript type) | Extend the user shape with the new optional `instanceBaseUrlConfigurationHealthy?: boolean`. |

### Client EE (0 files)

`UserProfileDTO extends UserProfileCE_DTO`, so the field flows through. `ee/AppRouter.tsx` extends/inherits `ce/AppRouter.tsx`'s structure — verify during implementation that the mount is picked up; if EE overrides the relevant region, mirror the mount in `ee/AppRouter.tsx`.

## Multi-org behavior

This is the most important EE-specific concern, so calling it out explicitly:

| Deployment | Banner ever shows? | Why |
|---|---|---|
| CE (any), `APPSMITH_BASE_URL` set | No | `SecureBaseUrlResolverCEImpl#isBaseUrlConfigurationHealthy()` returns `true` |
| CE (any), `APPSMITH_BASE_URL` unset | Yes (super users only) | Resolver returns `false` |
| EE single-org, `APPSMITH_BASE_URL` set | No | EE override: multi-org off → delegate → CE returns `true` |
| EE single-org, `APPSMITH_BASE_URL` unset | Yes (super users only) | EE override: multi-org off → delegate → CE returns `false` |
| EE multi-org (Appsmith Cloud) | **Never** | EE override short-circuits to `Mono.just(true)` regardless of `APPSMITH_BASE_URL` |

## Error handling

Three failure modes worth nailing down:

1. **`featureFlagService.check(...)` errors out** (FF service unreachable, DB blip). EE override defaults to "treat as multi-org off" via `.onErrorResume(e -> super.isBaseUrlConfigurationHealthy())`. Rationale: a false-positive banner is recoverable (admin sees a misleading warning, can ignore); a false-negative would silently leave a real misconfig invisible. Logged at WARN.
2. **Resolver `Mono` errors during DTO assembly.** The DTO assembler wraps the call with `.onErrorReturn(true)`. Login must never break because of a banner-signal error. Logged at ERROR (this would be a real bug). Net result: transient blip → no banner → admin keeps working → next session retries.
3. **Field missing from response** (rolling deploy). The TypeScript field is declared optional. The selector explicitly checks `=== false`, so `undefined` → no banner. Standard tri-state guard for new optional fields.

## Edge cases (all by-construction, no extra code)

| Case | Behavior |
|---|---|
| Anonymous user / logged out | `isSuperUser === false` → no banner |
| Logged-in non-admin | `isSuperUser === false` → no banner |
| Super user but `adminSettingsVisible === false` (RBAC, license tier) | No banner — CTA would be useless |
| EE multi-org enabled (Cloud) | Resolver short-circuits → no banner |
| Admin viewing `/settings/configuration` already | Banner still shows — actually helpful, contextually reinforces *which* field to set |
| Admin saves from banner CTA | Existing Configuration-tier save → server restart → auto page-reload → banner clears. **No re-login.** |
| Admin in Tab A, saves from Tab B | Tab B reloads itself (existing flow); Tab A keeps showing stale banner until manual refresh. Acceptable — matches every other admin-setting in Appsmith today. |
| Admin sets value via CLI / direct env, restarts container | No restart-poll triggered in any open tab. Banner persists in open tabs until manual refresh. Same as any Configuration-tier setting. |
| EE multi-org licence flips off mid-session | License changes restart the server anyway — natural fresh session, banner appears (correctly) on next login. |
| Two browser tabs open as same admin | Both show banner; both clear together when admin saves and the SPA reloads. |

## Testing

| Layer | What | Why |
|---|---|---|
| **Server unit (CE)** | `SecureBaseUrlResolverCEImplTest` adds 2 cases for `isBaseUrlConfigurationHealthy()` — `true` when `APPSMITH_BASE_URL` set, `false` when blank. | Pins CE semantics. No Spring context, fast, runs on every PR. |
| **Server unit (EE)** | New `SecureBaseUrlResolverImplTest` (or extend an existing one) with 3 cases: multi-org on → `true` regardless of BASE_URL; multi-org off + BASE_URL set → `true`; multi-org off + BASE_URL unset → `false`. Mocks `featureFlagService.check(...)`. | Pins the multi-org override — the only place this branching is exercised. |
| **Server integration** | `UserServiceTest` — one new case under the `buildUserProfileDTO` coverage asserting the new field is present and reflects the resolver's answer. | End-to-end through the DTO assembler so we don't regress the `.zipWith` wiring. |
| **Client unit (Jest)** | `BaseUrlMissingBanner.test.tsx` — five cases: `isSuperUser=true, adminSettingsVisible=true, healthy=false` → renders; `healthy=true` → null; `isSuperUser=false` → null; `adminSettingsVisible=false` → null; field undefined → null. | Pins selector + render gating. Fast, deterministic, runs on every client PR. |
| **Client unit (selector)** | `usersSelectors.test.ts` — one case for the explicit-`=== false` guard (undefined / missing → false). | Pins the rolling-deploy safety. |
| **Cypress** | **Skip.** | CI sets `APPSMITH_BASE_URL=http://localhost`, so the banner never fires in CI by construction. Writing a Cypress test that mutates `/admin/env` to clear it mid-run, restarts the server, and asserts the banner — high cost, low yield. The Jest cases cover rendering; the unit tests cover the resolver. |

## Risks

1. **Banner pushes layout down ~40-48px.** Existing Cypress specs that use absolute pixel coordinates against the AppHeader could break. Mitigation: most existing specs use semantic selectors (text, `data-cy`); the banner is hidden in CI anyway because `APPSMITH_BASE_URL=http://localhost` is set in every CI workflow as of [`dd8fbedea8`](https://github.com/appsmithorg/appsmith/commit/dd8fbedea8). Risk is essentially zero in CI.
2. **Field name on the DTO.** Long but semantically accurate. Trivial rename if the team prefers shorter (`baseUrlHealthy`, `baseUrlConfigured`) — single-find-replace plus the TypeScript shape.
3. **EE override path.** The override needs `featureFlagService.check(...)` injected. If we ever introduce other resolver methods that need similar gating, refactor the multi-org branch into a private helper. Not needed for v1.

## Files explicitly NOT changed

- `app/client/src/components/editorComponents/ProductAlertBanner.tsx` — unrelated; covers ephemeral product news with per-message dismiss/snooze tracking. Wrong abstraction for "fix-the-config-and-it-stops" misconfig signal.
- The reducer/saga/action layer — no new Redux state because the field is on the existing `currentUser` slice that's already loaded.
- The HTTP layer — no new endpoint; signal rides on `/v1/users/profile` which already runs at session start.
- The Docker image / Dockerfile — must NOT bake in any default `APPSMITH_BASE_URL` value. Production deployments need their own canonical URL.

## Validation

1. CE branch builds and unit tests pass locally.
2. Manual smoke (CE): start a fresh container without `APPSMITH_BASE_URL`, log in as super user → banner visible. Set the value via Admin Settings → save → server restart → SPA auto-reload → banner gone, no login redirect.
3. Manual smoke (CE): same flow logged in as non-admin → banner not visible.
4. Manual smoke (EE single-org): same as CE.
5. Manual smoke (EE multi-org): banner not visible regardless of `APPSMITH_BASE_URL` value.
6. Sync test (per AGENTS.md): `git fetch community release` → branch from `community/release` → cherry-pick the CE commits → confirm clean apply (the only EE-specific addition is the resolver override which has no overlap with the CE files).

## Out of scope

- Documenting the new `instanceBaseUrlConfigurationHealthy` field in any external API doc — internal DTO field, not part of the public REST contract.
- Translating the banner copy into other locales (Appsmith does not yet have a runtime i18n layer; copy uses the existing `messages.ts` mechanism).
- Server-side enforcement that admins cannot dismiss the banner (the banner is non-dismissible client-side; an attacker mutating their local Redux state to hide it just hides it for themselves, no security impact).
