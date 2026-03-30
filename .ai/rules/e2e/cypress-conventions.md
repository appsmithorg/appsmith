# Cypress E2E Test Conventions

## Framework

- Cypress 13.13.0 with `testIsolation: false` (tests share state within a spec)
- Plugins: `@cypress/grep` (tag filtering), `cypress-real-events`, `cypress-network-idle`, `cypress-xpath`, `cypress-file-upload`
- Viewport: 1400x1200
- Timeouts: `defaultCommandTimeout: 30000`, `requestTimeout/responseTimeout: 60000`

## Running Tests

```bash
cd app/client && yarn test                              # E2E tests (against dev.appsmith.com)
cd app/client && npx cypress run --spec <spec-path>     # Specific spec file
cd app/client && npx cypress open                       # Interactive mode
```

## Test Structure

```text
app/client/cypress/
├── e2e/
│   ├── Regression/
│   │   ├── ClientSide/    # ~48 subdirectories (Widgets, BugTests, IDE, Git, etc.)
│   │   └── ServerSide/    # ~12 subdirectories (ApiTests, Datasources, etc.)
│   ├── Sanity/            # Quick sanity checks
│   └── Smoke/             # Smoke tests
├── fixtures/              # DSL JSON files and test data
├── locators/              # Centralized selectors (44 files)
└── support/
    ├── Pages/             # Page object classes (34 singletons)
    ├── Objects/ObjectsCore.ts  # Central registry for page objects
    └── commands.js        # Custom Cypress commands
```

## Page Object Pattern (Mandatory)

All tests import page objects from `ObjectsCore.ts` — do NOT use raw `cy.get()` for common operations:

```typescript
import {
  agHelper,
  locators,
  dataSources,
  deployMode,
  homePage,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
```

### Key page objects

| Object | Purpose |
|--------|---------|
| `agHelper` | Central utility — clicks, assertions, DSL loading, waits |
| `locators` | Centralized CSS selectors |
| `dataSources` | Datasource CRUD operations |
| `deployMode` | Publish app and navigate deployed view |
| `homePage` | Workspace and app management |
| `jsEditor` | JS object creation and editing |
| `propPane` | Property pane interactions |

### Common agHelper methods

| Method | Purpose |
|--------|---------|
| `agHelper.AddDsl("dslName")` | Load widget layout fixture via API |
| `agHelper.GetNClick(selector, index, force)` | Find & click |
| `agHelper.AssertContains(text)` | Assert page text |
| `agHelper.AssertElementVisibility(sel)` | Visibility assertion |
| `agHelper.AssertElementAbsence(sel)` | Absence assertion |
| `agHelper.ValidateToastMessage(msg)` | Toast check |
| `deployMode.DeployApp()` | Publish and switch to deployed view |
| `deployMode.NavigateBacktoEditor()` | Return to edit mode |

## Selector Strategy

Three tiers, in order of preference:

1. **`t--` CSS classes** (dominant): `className="t--application-publish-btn"`
   - Auto-generated: `.t--draggable-{widgetType}` (edit), `.t--widget-{widgetName}` (deployed)
2. **`data-testid`** (growing): `data-testid="t--git-connect-next"`
3. **`data-widgetname-cy`** (widget-specific): `data-widgetname-cy={props.widgetName}`

Selectors centralized in `cypress/locators/` (44 files) plus `CommonLocators.ts` (300+ selectors).

## Test File Conventions

### Naming

- TypeScript (preferred): `FeatureName_Spec.ts` (capital S in Spec)
- Legacy JavaScript: `WidgetName_spec.js`
- Bug tests include numbers: `Bug14987_spec.js`, `DS_Bug26941_Spec.ts`

### Structure (testIsolation: false)

Tests within a spec share state. Use numbered `it` blocks for sequential steps:

```typescript
describe(
  "Feature Name",
  { tags: ["@tag.Widget", "@tag.Input"] },
  function () {
    it("1. Setup and verify initial state", function () { ... });
    it("2. Perform action and verify result", function () { ... });
    it("3. Cleanup", function () { ... });
  },
);
```

Tags follow `@tag.Category` pattern for `@cypress/grep` filtering.

## Setup / Teardown

### Global (in `cypress/support/e2e.js`)

- `before()` — API-based login via `cy.LoginFromAPI()`, create workspace + app
- `beforeEach()` — Re-initialize localStorage, register ~116 route intercepts
- `after()` — Delete app and workspace via API

### Per-spec

- `before()` — Load DSL fixtures: `agHelper.AddDsl("chartDsl")`
- Final `it` block — Delete created entities

## API Intercept Pattern

Route intercepts are spy-style (not stubs). Registered in bulk via `startServerAndRoutes`:

```typescript
cy.intercept("PUT", "/api/v1/themes/applications/*").as("updateTheme");
cy.intercept("POST", "/api/v1/datasources/test").as("testDatasource");
```

Wait on aliases for synchronization: `cy.wait("@importNewApplication")`

No `cy.intercept({ fixture: '...' })` stubbing — all tests run against a real backend.

## DSL Fixtures

Widget layouts defined as JSON in `cypress/fixtures/`. Loaded via `agHelper.AddDsl()` which injects via `PUT /api/v1/layouts/`:

```json
{
  "dsl": {
    "widgetName": "MainContainer",
    "type": "CANVAS_WIDGET",
    "children": [
      { "widgetName": "Input1", "type": "INPUT_WIDGET_V2", ... }
    ]
  }
}
```

## Key Conventions

- API-based setup/teardown — login, workspace creation, cleanup all via API, not UI
- No test isolation — sequential numbered `it` blocks within a spec
- Page objects over raw commands — use `agHelper`, `dataSources`, etc.
- Selectors: prefer `t--` classes, centralize in `locators/`
- Tags for categorization: `@tag.Widget`, `@tag.Datasource`, `@tag.Git`, etc.
