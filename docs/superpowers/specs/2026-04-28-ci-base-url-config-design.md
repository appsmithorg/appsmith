# CI Configuration for `APPSMITH_BASE_URL` (GHSA-j9gf-vw2f-9hrw follow-up)

**Date:** 2026-04-28
**Author:** subrata71
**Companion to:** [PR #41766](https://github.com/appsmithorg/appsmith/pull/41766) (CE), [PR #8997](https://github.com/appsmithorg/appsmith-ee/pull/8997) (EE)
**Linear:** [APP-15046](https://linear.app/appsmith/issue/APP-15046)

## Context

The fix for [GHSA-j9gf-vw2f-9hrw](https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw) makes the server fail-closed for token-bearing email flows (forgot-password, email verification, workspace invite, instance-admin invite) whenever `APPSMITH_BASE_URL` is unset. The Cypress E2E suite in `ci-test-*` workflows spins up a fresh Appsmith Docker container that does not set `APPSMITH_BASE_URL`, so every spec exercising those flows now fails with `MISCONFIGURED_INSTANCE_BASE_URL`.

Concrete failures observed on the [first PR run](https://github.com/appsmithorg/appsmith/actions/runs/25035460641): `Email_settings_Spec.ts`, `ExportApplication_spec.js`, `DeleteWorkspace_spec.ts`, `LeaveWorkspaceTest_spec.js`, `MemberRoles_Spec.ts`, `ShareAppTests_Spec.ts`. All emit the same client-side error: `APPSMITH_BASE_URL is not configured. Token-bearing email flows are disabled until the canonical instance URL is set.`

The unit/integration test suite was already addressed in commit `35eb077e58` by setting `APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS=true` in `application-test.properties`. That fix does **not** apply to Cypress, which runs against the production profile of a deployed Docker container.

## Decision

**Approach A: configure `APPSMITH_BASE_URL` at container startup in every CI environment that runs Cypress.** Treat CI as a real deployment that satisfies the new contract. Do **not** use the migration flag (`APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS`) in CI — we want E2E coverage of the new secure path.

Rationale:
- Production-realistic. CI becomes the canonical example of how self-hosted operators should configure their instance.
- Exercises the new strict-mode `Origin == APPSMITH_BASE_URL` check end-to-end.
- One-time small workflow change (~5 files).
- The fail-closed semantics introduced by the GHSA fix are still pinned by `SecureBaseUrlResolverCEImplTest` unit tests, so the test pyramid stays balanced.

Approach B (`APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS=true` in CI) was rejected because it would never exercise the secure path E2E and would spam every CI log with the helper's WARN message.

## Files to change

### CI workflows (5 lines each, identical pattern)

For each of these workflows, add `-e APPSMITH_BASE_URL=http://localhost \` to the `docker run -d --name appsmith` block:

| File | Approximate line of `docker run --name appsmith` |
|------|--------------------------------------------------|
| `.github/workflows/ci-test-limited.yml` | 182 |
| `.github/workflows/ci-test-limited-with-count.yml` | 271 |
| `.github/workflows/ci-test-custom-script.yml` | 184 |
| `.github/workflows/ci-test-playwright.yml` | 169 |

The container exposes port 80 → host port 80, and Cypress hits `http://localhost`. Browsers omit `:80` from the `Origin` header for default-port URLs, so `APPSMITH_BASE_URL=http://localhost` matches exactly.

### Deploy preview (Helm)

`scripts/deploy_preview.sh` (around line 117) — add to the `helm upgrade` arg list:

```
--set applicationConfig.APPSMITH_BASE_URL=https://$DOMAINNAME
```

`$DOMAINNAME` is already computed on line 22 as `$edition-$PULL_REQUEST_NUMBER.dp.appsmith.com`. The Helm chart already propagates `applicationConfig.*` to container env (existing pattern: `APPSMITH_DB_URL`, `APPSMITH_SENTRY_DSN`, …).

### Local developer parity (optional)

`scripts/local_testing.sh` (line 124) — add `-e APPSMITH_BASE_URL=http://localhost \` to the local docker-run helper. This keeps developer-local Docker behavior consistent with CI. Skip if you'd rather minimize blast radius.

## Files explicitly NOT changed

- `.github/workflows/ci-test-hosted.yml` — runs against an externally-managed hosted Appsmith instance (not Docker). The hosted instance's configuration is owned by ops; the workflow itself doesn't `docker run` Appsmith.
- `.github/workflows/server-build.yml`, `server-integration-tests.yml` — server unit/integration tests via Maven; already fixed via `application-test.properties`.
- `.github/workflows/build-docker-image.yml`, `test-build-docker-image.yml` — they orchestrate but do not themselves `docker run` Appsmith. They invoke the child workflows above.
- The Docker image / Dockerfile itself — must NOT bake in any default `APPSMITH_BASE_URL` value. Production deployments need their own canonical URL; baking a default would defeat the security improvement.

## Risks

1. **Origin string mismatch.** Strict-mode requires exact equality. Cypress sends `Origin: http://localhost` for default-port traffic to `http://localhost`. Verified by reading the existing `Email_settings_Spec.ts` test 3 (lines 172-181) which already strips trailing slashes from `originUrl` before forwarding — confirming the team has thought about this surface. **Mitigation:** if a spec passes a different Origin, we'll see `Origin header does not match APPSMITH_BASE_URL configuration` (HTTP 400) — clear and actionable, not a silent failure.

2. **Helm chart key naming.** `applicationConfig.APPSMITH_BASE_URL` — confirmed pattern matches existing entries. **Mitigation:** the existing deploy preview will surface any mistake on first run.

3. **Rollback.** If anything misbehaves, removing the env vars from these files restores prior CI behavior. Production fail-closed default in the server is unaffected.

## Validation

1. Re-trigger the failing CI run on PR #41766. All previously-failing Cypress specs should pass.
2. Re-trigger a deploy preview build to verify `APPSMITH_BASE_URL` propagates correctly via Helm.
3. Smoke-test by running one Cypress spec locally with `APPSMITH_BASE_URL=http://localhost` set on a fresh container.

## Out of scope

- Adding a Cypress `before` hook to set `APPSMITH_BASE_URL` via the admin settings UI — not needed since we set it at container startup.
- Cypress test code changes — none needed.
- Changes to the Docker image (Dockerfile / base.dockerfile).
- Documenting the new requirement in user-facing operator docs — separate doc PR after release.
