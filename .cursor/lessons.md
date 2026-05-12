# Lessons Learned

## Spring Boot Major Version Upgrades Break Internal API Overrides
**Date:** 2026-03-10
**Context:** Spring Boot 3.3.13 → 3.5.11 upgrade (Spring Data MongoDB 4.3.13 → 4.5.9)

The soft-delete mechanism (`SoftDeleteMongoRepositoryFactory` → `SoftDeleteMongoQueryLookupStrategy` → `SoftDeletePartTreeMongoQuery`) overrides internal Spring Data methods. When upgrading Spring Boot/Spring Data across minor versions:

- `ReactiveMongoRepositoryFactory.getQueryLookupStrategy` changed its second parameter from `QueryMethodEvaluationContextProvider` to `ValueExpressionDelegate`.
- `ReactivePartTreeMongoQuery` added a new constructor taking `ValueExpressionDelegate`.
- Our factory override silently became a dead method (Java doesn't error on overriding a method that no longer exists in the parent if the old signature still exists elsewhere in the hierarchy).

**Symptom:** Derived query methods (e.g., `findAllByUserId`) stopped filtering soft-deleted records because `SoftDeletePartTreeMongoQuery` was never created.

**Fix:** Updated all three classes in `configurations/mongo/` to use `ValueExpressionDelegate` API.

**Lesson:** When doing major Spring Boot upgrades, always verify custom repository infrastructure that overrides Spring Data internals. Use `@Override` annotation and check compilation warnings — if an override silently stops matching the parent method, the annotation will cause a compile error.

## Domain Objects Can Cross Multiple Serialization Boundaries
**Date:** 2026-03-16
**Context:** `lombok.getter.noIsPrefix=true` serialization audit for `Plugin` domain

Domain classes aren't limited to one serialization boundary. `Plugin` crosses **three**:
1. **Cloud Service → Server** (Jackson deserialization via `fetchPluginsFromCS` / WebClient)
2. **Server ↔ MongoDB** (Spring Data field access — unaffected by getter changes)
3. **Server → Client** (Jackson serialization with `@JsonView` via controllers)

I initially only audited `Plugin` fields from the client perspective and classified `isSupportedForAirGap` as "Internal view only" because it has `@JsonView(Views.Internal.class)`. But `@JsonView` only controls **outbound serialization** in controller responses — it does NOT gate **inbound deserialization** from WebClient calls. The field silently breaks when Cloud Service sends the old JSON key.

**Lesson:** When auditing serialization changes, trace every domain's full lifecycle — not just the most obvious boundary. Search for `bodyToMono`, `WebClient`, `RestTemplate` usages that deserialize the domain. A domain with `@JsonView(Internal)` can still cross external boundaries via non-controller code paths.

## Playwright Setup: Don't Assume Accessible HTML
**Date:** 2026-04-03
**Context:** Setting up Playwright E2E tests, auth setup failing on `getByLabel("Email")`

Appsmith's `FormGroup` (from `@appsmith/ads-old`) renders a visual label but doesn't create a proper `<label for="...">` association with the `<input>`. This means `page.getByLabel("Email")` times out — the a11y tree doesn't link them.

**Symptom:** `getByLabel("Email")` timeout in auth.setup.ts, even though the label text visually exists on the page.

**Fix:** Fall through the Playwright selector priority — use `getByPlaceholder("Enter your email")` instead. Never jump to raw CSS selectors (`input[name='username']`) just because the first semantic locator fails.

**Lesson:** When a semantic locator fails in Playwright, it's surfacing a real accessibility gap in the app. Walk down the priority chain (getByRole → getByLabel → getByPlaceholder → getByTestId) before resorting to raw CSS. Raw CSS selectors are the Cypress anti-pattern we're trying to escape — they couple to DOM implementation, not user behavior.

## Playwright --ui Mode Needs Bundled Chromium
**Date:** 2026-04-03
**Context:** `npx playwright test --ui` failing with "No chromium-based browser found"

Playwright's `--ui` mode uses `findChromiumChannelBestEffort()` to find a browser for its UI shell. This function only checks: bundled Playwright Chromium, system Chrome, and system Edge — in hardcoded paths. It does NOT check Brave, and env vars like `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` don't affect this codepath.

**Fix:** Run `npx playwright install chromium` once. This is a one-time ~165MB download to `~/Library/Caches/ms-playwright/`.

**Lesson:** The Playwright UI shell browser and the test execution browser are separate concerns. Don't try to force Brave/custom browsers into the UI shell — just install bundled Chromium for it. The `executablePath` config only controls which browser runs your tests, not the `--ui` shell.

## Playwright Parallelization: Setup Projects for Expensive Shared State
**Date:** 2026-04-03
**Context:** Migrating DSCrudAndBindings Cypress test — needs expensive Git import as setup, then 5 parallel tests

When multiple parallel tests depend on the same expensive setup (e.g., Git import of an app, complex data seeding), Playwright's **setup project pattern** avoids repeating that setup per test. The setup project runs once, writes shared state to a JSON file (e.g., `playwright/.state/migration.json`), and the test files read it to get workspace IDs, deploy URLs, etc.

This is identical to how `auth.setup.ts` writes `storageState` to `playwright/auth/user.json` — it's just passing browser cookies between processes. The `migration.json` equivalent passes app metadata (workspace ID, deploy URL, deploy key ID) so each parallel test knows where to navigate and what to clean up.

**Three options considered:**
1. **Serial** (`test.describe.serial`) — simple but no parallelism, cascading failures
2. **Separate files, each imports** — full isolation but repeats expensive setup N times
3. **Shared setup project** — import once, save state to JSON, N tests run in parallel reading it

**Lesson:** When setup is cheap (API create workspace ~1s), let each test do its own (Option 2). When setup is expensive (Git import ~10-30s, data seeding), use a setup project (Option 3). The coordination file only carries IDs/URLs between processes — the actual data lives in the database. Don't default to `test.describe.serial()` just because Cypress forced shared state via `testIsolation: false`.

## Playwright: Convention Drift During Bulk File Generation
**Date:** 2026-04-03
**Context:** Generated 5 migration test files in a batch — all violated two rules we explicitly set up

When generating multiple files in a batch, the agent drifted from agreed conventions:
1. Used `page.waitForLoadState("networkidle")` in every spec despite having an ESLint rule banning it and a Cursor rule explaining why.
2. Used hardcoded `"/api/v1/actions/execute"` instead of `API.actionsExecute` from `constants/api-routes.ts`.
3. Used inline `.t--widget-textwidget` instead of `SELECTORS.widgetInDeployed("text")` from `constants/selectors.ts`.

**Lesson:** After generating multiple files, audit every file against the established rules — especially wait strategies and constant usage. The `networkidle` shortcut and string literals are the path of least resistance during generation; they're the first things to check. Run ESLint before declaring done: `npx eslint playwright/tests/ --ext .ts`.

## Playwright API setup: verify query params against the server
**Date:** 2026-04-08
**Context:** `migration.setup.ts` listed datasources with `?applicationId=`; server only accepts `workspaceId`

`GET /api/v1/datasources` is implemented as `DatasourceServiceCEImpl.getAllWithStorages`, which reads **only** `workspaceId` from query params. Any other query (or none) yields **400** `INVALID_PARAMETER` for workspace id. The agent assumed `applicationId` was valid because the setup had just imported an app.

**Fix:** Use `?workspaceId=${workspace.id}` (same workspace as Git import).

**Lesson:** Never guess REST query parameters from context ("we have an app id, so list by app"). Always open the Java controller → service for that path and copy the exact param names. Add this to the Playwright rule checklist before shipping request-based setup or specs.

## Appsmith Editor URL Format
**Date:** 2026-04-09
**Context:** Migration test `page.goto()` used `/applications/${appId}/pages/${pageId}` — not a valid Appsmith frontend route

Appsmith has two valid editor URL formats:
1. **Literal fallback:** `/app/application/page-{pageId}/edit?branch={branchName}` — "application" and "page-" are literal strings
2. **Slug-based:** `/app/{appSlug}/{pageSlug}-{pageId}/edit?branch={branchName}` — uses actual app and page slugs

For non-git apps, omit `?branch=...`. The agent incorrectly assumed "application" in format 1 was a placeholder for the app slug, producing a hybrid URL that matched neither format.

**Lesson:** When the user provides an exact URL pattern, treat every segment as literal unless explicitly told otherwise. Don't silently interpret fixed strings as dynamic placeholders — ask if unsure. Created `helpers/url.ts` with `editorUrl()` wrapper that uses format 2 when slugs are available, falls back to format 1.

## Appsmith Widget CSS Classes Include the "widget" Suffix
**Date:** 2026-04-09
**Context:** Playwright `SELECTORS.widgetInDeployed("text")` generated `.t--widget-text` — element not found in DOM

Appsmith widget type identifiers in CSS classes include a `widget` suffix. The Cypress `WIDGET` constants in `cypress/locators/WidgetLocators.ts` define the canonical names: `TEXT = "textwidget"`, `AUDIO = "audiowidget"`, `CHART = "chartwidget"`, etc. The deployed-mode selector is `.t--widget-{widgetType}`, so the full class is `.t--widget-textwidget`, not `.t--widget-text`.

The exception is widgets that already include a version suffix: `INPUT_V2 = "inputwidgetv2"`, `TABLE = "tablewidgetv2"`.

**Lesson:** Always cross-reference Cypress `WidgetLocators.ts` when writing Playwright selectors for Appsmith widgets. The type string passed to `widgetInDeployed()` must match the Cypress `WIDGET.*` constant exactly — don't strip suffixes or guess shortened names.