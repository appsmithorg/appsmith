---
name: write-and-verify-pw-test
description: >-
  Write a Playwright E2E test from a prompt and verify it passes against a live
  Appsmith deployment. Configures environment variables, writes the spec following
  project conventions, runs it, and auto-fixes up to 3 times. Use when asked to
  "write a playwright test", "test this feature on a dp", "create and run an e2e test",
  or "verify this flow with playwright".
---

# Write & Verify Playwright Test

## Prerequisites

Before starting, ensure Chromium is available:

```bash
cd app/client && npx playwright install chromium 2>/dev/null
```

## Step 1 — Configure Environment

Run the `configure-env.sh` script to set up `app/client/playwright/.env`. It creates the file if missing and merges new values with any existing ones.

```bash
node .cursor/skills/write-and-verify-pw-test/scripts/configure-env.js \
  --PLAYWRIGHT_BASE_URL=https://target-dp.appsmith.com \
  --USERNAME=user@example.com \
  --PASSWORD=secret
```

Pass only the variables the caller provided. The script preserves existing values for anything not overridden. Supported variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `PLAYWRIGHT_BASE_URL` | Yes | Target deployment URL |
| `USERNAME` | If no `.env` exists | Login credentials |
| `PASSWORD` | If no `.env` exists | Login credentials |
| `DATASOURCE_HOST` | No | For datasource tests |
| `GITEA_BASE_URL` | No | For git tests |
| `GITEA_API_TOKEN` | No | For git tests |
| `GIT_CLONE_URL` | No | For git tests |
| `PW_FLAG_OVERRIDES` | No | JSON string, e.g. `'{"flag": true}'` |

`PW_FLAG_OVERRIDES` can go in `.env` via the script, or be passed inline when running tests (see Step 6).

## Step 2 — Read Project Conventions

Before writing any spec, read these files for conventions (they are auto-applied when editing `playwright/**/*.ts`, but read them explicitly here):

- `.cursor/rules/playwright.mdc` — full conventions (POM rules, selectors, assertions, wait strategy)

Key rules to internalize:

1. **Imports**: `import { test, expect } from "../../fixtures"` (not `@playwright/test`)
2. **Selectors**: Use `getByRole()` > `getByLabel()` > `getByTestId()` > `SELECTORS` from constants. Never raw CSS.
3. **No hard waits**: No `waitForTimeout`, no `networkidle`. Wait for meaningful elements.
4. **Auto-retrying assertions**: `await expect(locator).toBeVisible()`, not `expect(await locator.isVisible()).toBe(true)`
5. **Constants**: API paths from `playwright/constants/api-routes.ts`, selectors from `playwright/constants/selectors.ts`, routes from `playwright/constants/routes.ts`. Never hardcode.
6. **POMs**: Constructor takes `Page`. No assertions in POMs. 1-5 lines per method.
7. **API contract verification**: Before any `request.get`/`request.post`, grep the server for the controller to confirm exact parameter names.

## Step 3 — Determine Placement

### Pick the tier

| Tier | Directory | When |
|------|-----------|------|
| smoke | `playwright/tests/smoke/` | Login, create app, basic alive checks |
| sanity | `playwright/tests/sanity/<feature>/` | Core flows for a feature area |
| regression | `playwright/tests/regression/<feature>/` | Edge cases, complex interactions |
| ee | `playwright/tests/ee/{sanity,regression}/<feature>/` | EE-only features |

If the caller specifies a tier, use it. Otherwise, default to `sanity`.

Feature subdirectories are **mandatory** under `sanity/` and `regression/`.

### Decide: existing project, new project, or multiple specs

Read `playwright.config.ts` to understand the current projects and their setup chains.

**Use an existing project** when the new spec:
- Lives in a directory already covered by a project's `testDir`
- Doesn't need setup beyond what that project's dependency chain provides
- Example: a new widget test at `tests/sanity/widgets/chart.spec.ts` → use the `sanity` project

**Create a new project** when the new spec:
- Needs an expensive shared precondition not covered by existing setups (e.g., importing an app via API, connecting a specific datasource, seeding test data)
- Would slow down unrelated tests if its setup ran in a shared project
- Follow the setup/teardown/state-reader pattern from `playwright.mdc` (Parallelization section):
  1. Setup file in `playwright/fixtures/<name>.setup.ts` — performs the operation, writes state to `playwright/.state/<name>.json`
  2. Teardown file in `playwright/fixtures/<name>.teardown.ts` — cleans up
  3. State reader in `playwright/helpers/<name>-state.ts` — typed accessor for test files
  4. New project entry in `playwright.config.ts` with `dependencies`, `testDir`, and `teardown`

**Split into multiple spec files** when:
- The prompt describes multiple independent pages or concerns — one spec per page/concern
- Tests within a shared-setup project should be parallelizable — each file runs independently, reads shared state, navigates directly to its target
- A single spec would exceed ~10 tests — split by sub-feature
- Example: Git migration tests are split into `migration-mysql.spec.ts`, `migration-postgres.spec.ts`, `migration-modal-form.spec.ts` — all under `regression/git/`, all share the `migration-setup` project, each focused on one page

**Rule of thumb**: One `test.describe` per spec file, one concern per `test()`. If the prompt covers multiple concerns, prefer multiple small specs over one large one.

## Step 4 — Write the Spec

Write the spec file following these patterns. Reference existing examples:

**Simple spec** (smoke-level):

```typescript
import { test, expect } from "../../fixtures";
import { ROUTES } from "../../constants/routes";

test.describe("Smoke — Feature Name", () => {
  test("behavior description in lowercase", async ({ page }) => {
    await page.goto(ROUTES.applications);
    await expect(page.getByRole("button", { name: /new/i })).toBeVisible();
  });
});
```

**Spec with fixture workspace/app** (sanity/regression):

```typescript
import { test, expect } from "../../fixtures";
import { SELECTORS } from "../../constants/selectors";

test.describe("Feature — Specific Area", () => {
  test("filters table by country", async ({ page, app }) => {
    await page.goto(app.url);
    await expect(page.locator(SELECTORS.widgetInDeployed("textwidget")).first()).toBeVisible();
    // test logic here
  });
});
```

**If a POM is needed**, create it under `playwright/page-objects/` (or `components/` for reusable widgets). Follow existing patterns like `home.page.ts`.

## Step 5 — Lint Check

After writing each file, run:

```bash
cd app/client && npx eslint <spec-file-path> --ext .ts
```

Fix any issues before proceeding.

## Step 6 — Run the Test

### Auth chain (automatic — do not skip)

The config chains setup projects: `signup-setup` → `setup` → your test project. This handles fresh deployments automatically:

- **signup-setup**: Creates the user if needed (handles empty instance onboarding, legacy signup, and "already exists" gracefully)
- **setup**: Logs in and saves auth state to `playwright/auth/user.json`
- **test project**: Runs your specs with the saved auth state

This chain runs automatically when you use `--project`. **Never bypass it** by running test files directly without a project flag.

### Determine the correct project

**Critical**: Each project in `playwright.config.ts` has its own `testDir`, `dependencies`, and sometimes `testIgnore`. The spec **must** be run under the project whose `testDir` matches and whose dependency chain includes the required setup.

Read `playwright.config.ts` and match your spec's directory to a project. Current mapping:

| Spec directory | `--project` flag | Setup chain |
|----------------|-----------------|-------------|
| `tests/smoke/` | `smoke` | signup → auth |
| `tests/sanity/` | `sanity` | signup → auth |
| `tests/regression/` (non-git) | `regression` | signup → auth |
| `tests/regression/git/` | `regression-git` | signup → auth → **migration-setup** (+ teardown) |

**Why this matters**: Some projects have extra setup phases (e.g., `regression-git` depends on `migration-setup` which imports a Git app and creates datasources). Specs in those directories read shared state produced by the setup (e.g., `loadMigrationState()`). Running them under the wrong project skips that setup and they fail immediately.

**When writing a new spec that needs a custom setup project** (e.g., it relies on pre-imported data, a connected datasource, or shared app state):

1. Check if an existing setup project covers the need
2. If not, create a new setup/teardown pair following the pattern in `playwright.mdc` (Parallelization section)
3. Add the new project to `playwright.config.ts` with proper `dependencies` and `testDir`
4. Update this mapping table

**If the config has changed** since this skill was written, always read `playwright.config.ts` to get the current project list. Don't rely on this table alone.

### Run command

```bash
cd app/client && npx playwright test <spec-file-path> --project=<project>
```

If `PW_FLAG_OVERRIDES` was provided:

```bash
cd app/client && PW_FLAG_OVERRIDES='{"flag_name": true}' npx playwright test <spec-file-path> --project=<project>
```

**Timeout**: Set `block_until_ms` to at least 120000 (2 min). Tests can take 60s+ with signup + auth setup on first run against a fresh deployment.

## Step 7 — Retry Loop (max 3 attempts)

If the test fails, classify the failure:

### Test bug signals (fix the spec):

- `locator.click: Target closed` → wrong selector or premature navigation
- `Timeout` + element exists in DOM but not visible → missing wait or wrong locator
- `strict mode violation` → locator matches multiple elements, needs `.first()` or refinement
- `Error: expect(received).toHaveText(expected)` where expected value is clearly wrong → bad test data
- Import errors, TypeScript errors → code issue in the spec
- `waiting for locator` → selector doesn't match anything, check the actual page

**Action**: Read the error output, fix the spec, re-run. This is attempt N+1.

### Product bug signals (stop and diagnose):

- `expect(received).toHaveText(expected)` where expected is correct but received shows clearly wrong app behavior
- `net::ERR_CONNECTION_REFUSED` → deployment is down
- `401 / 403` after successful auth setup → permission regression
- Visual mismatch where the test selector is correct but the UI renders wrong content
- Server returns 500 on API calls

**Action**: Stop retrying. Switch to the `diagnose-pw-failure` skill. See `.cursor/skills/diagnose-pw-failure/SKILL.md`.

### Ambiguous failures:

Default to "fix the spec" for the first 2 attempts. If the same assertion fails 3 times with the same received value, it's likely a product bug — switch to diagnosis.

## Step 8 — Summary

After the test passes (or after exhausting retries), provide a summary:

**On success:**
```
## Playwright Test Result: PASS

**Spec**: playwright/tests/sanity/widgets/table-filter.spec.ts
**Deployment**: https://my-dp.appsmith.com
**Project**: sanity
**Attempts**: 2 (1 fix applied: wrong selector for filter button)

### What was tested
- Table widget renders with data
- Filtering by country "Ba" shows Bangladesh
```

**On failure (product bug):**
```
## Playwright Test Result: FAIL (product bug suspected)

**Spec**: playwright/tests/sanity/widgets/table-filter.spec.ts
**Deployment**: https://my-dp.appsmith.com
**Attempts**: 3 (spec verified correct)

### Failure
- Table filter returns empty results when filtering by "Ba"
- Expected: rows containing "Bangladesh"
- Received: 0 rows
- Screenshot: playwright/results/<test-name>/screenshot.png

### Diagnosis
[See diagnose-pw-failure output]
```
