# Cypress E2E Test Conventions

## Framework

- Cypress 13 with `testIsolation: false` (tests share state within a spec)
- Viewport: 1400x1200. Timeouts: 30s default, 60s request/response.

## Page Object Pattern (Mandatory)

Import from `ObjectsCore.ts` — do NOT use raw `cy.get()` for common operations:

```typescript
import { agHelper, locators, dataSources, deployMode } from "../../../../support/Objects/ObjectsCore";
```

Key objects: `agHelper` (central utility), `locators` (selectors), `dataSources`, `deployMode`, `homePage`, `jsEditor`, `propPane`.

## Selector Strategy

1. `t--` CSS classes (dominant): `.t--application-publish-btn`
2. `data-testid` (growing): `data-testid="t--git-connect-next"`
3. `data-widgetname-cy` (widget-specific)

Centralized in `cypress/locators/` (44 files) + `CommonLocators.ts`.

## Test Structure

- File naming: `FeatureName_Spec.ts` (capital S). Bug tests: `Bug14987_spec.js`
- Numbered `it` blocks (sequential, shared state): `it("1. Setup...", ...)`, `it("2. Action...", ...)`
- Tags: `{ tags: ["@tag.Widget", "@tag.Input"] }` for `@cypress/grep` filtering

## Setup / Teardown

- Global: API-based login (`cy.LoginFromAPI()`), workspace + app creation
- Per-spec: `agHelper.AddDsl("dslName")` to load widget fixtures
- Cleanup: delete entities in final `it` block or `after()` hook

## API Intercepts

Spy-style (not stubs). All tests run against real backend:

```typescript
cy.intercept("POST", "/api/v1/datasources/test").as("testDatasource");
cy.wait("@testDatasource");
```

## Running Tests

```bash
npx cypress run --spec <spec-path>     # Specific spec
npx cypress open                       # Interactive mode
```
