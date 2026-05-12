---
name: diagnose-pw-failure
description: >-
  Diagnose a Playwright test failure as a product bug by analyzing error output,
  screenshots, traces, and server logs. Produces a structured bug report with
  expected vs actual behavior, reproduction steps, and likely root cause. Use when
  a Playwright test keeps failing after spec fixes, "is this a product bug",
  "diagnose this test failure", or "the test is correct but the app is broken".
---

# Diagnose Playwright Failure as Product Bug

## When to Use

Use this skill when:
- A spec has been fixed 2-3 times and the same assertion keeps failing with the same received value
- The spec's selectors and waits are correct but the app renders wrong content
- The server returns unexpected status codes (500, 403) on valid requests
- The `write-and-verify-pw-test` or `fix-pw-spec` skill has exhausted its retry budget

**Do not use** if the error is clearly a test code issue (import error, wrong selector syntax, TypeScript compilation error). Use `fix-pw-spec` instead.

## Step 1 — Collect Evidence

Gather all available evidence:

### a) Playwright error output
Read the terminal output from the failed test run. Note:
- The exact assertion that failed
- Expected vs received values
- Which test step failed (line number in the spec)

### b) Screenshots
Check `app/client/playwright/results/` for failure screenshots:

```bash
ls -la app/client/playwright/results/
```

If screenshots exist, read them (the Read tool supports images). They show exactly what the browser rendered at failure time.

### c) Trace (if available)
Traces are at `app/client/playwright/results/<test-path>/trace.zip`. Note their location for the bug report — they can be viewed with `npx playwright show-trace <path>`.

### d) Network responses
If the spec uses `waitForResponse`, check if the API response was captured in the error output. Common patterns:
- API returned 200 but with wrong data → backend logic bug
- API returned 500 → server crash
- API returned 403 → permission/auth regression
- API never responded (timeout) → endpoint broken or renamed

### e) Server-side code (optional, for deeper diagnosis)
If the failure involves an API call, trace the server code:

1. Identify the API endpoint from the spec (e.g., `API.actionsExecute` → `/api/v1/actions/execute`)
2. Find the controller: grep `app/server/` for `@PostMapping("/api/v1/actions/execute")` or similar
3. Read the service method to understand what could go wrong
4. Check if recent commits changed this code path

## Step 2 — Classify the Bug

| Category | Signals | Severity |
|----------|---------|----------|
| **UI rendering** | Wrong text, missing element, broken layout (screenshot shows it) | Medium |
| **Data regression** | API returns correct status but wrong payload | High |
| **Server error** | 500 response, stack trace in logs | Critical |
| **Auth/permission** | 401/403 on previously working endpoint | High |
| **Feature flag** | Feature works with flag on but not off (or vice versa) | Medium |
| **Deployment issue** | ECONNREFUSED, DNS failure, unhealthy containers | Blocker |
| **Race condition** | Intermittent — passes sometimes, fails others | Medium (flaky) |

## Step 3 — Verify It's Not a Spec Bug

Before declaring "product bug", do a sanity check:

1. **Manual verification**: Does the spec's assertion make sense? Re-read the test name and expected behavior.
2. **Check the deployment manually**: Navigate to `PLAYWRIGHT_BASE_URL` in your analysis and verify the page actually shows what the test expects.
3. **Check if the feature exists on this deployment**: The deployment might be on an older version that doesn't have the feature yet.
4. **Check feature flags**: If the feature is behind a flag, verify the flag is enabled on the deployment (check `PW_FLAG_OVERRIDES` or query `/api/v1/users/features`).

## Step 4 — Produce Bug Report

Output a structured diagnosis:

```
## Playwright Failure Diagnosis: PRODUCT BUG

**Spec**: playwright/tests/sanity/widgets/table-filter.spec.ts
**Test**: "filters table by country"
**Deployment**: https://my-dp.appsmith.com
**Category**: Data regression

### Expected behavior
Filtering the table by Country "starts with Ba" should show rows including "Bangladesh".

### Actual behavior
Filter returns 0 rows. The table is empty after applying the filter.

### Evidence
- **Assertion**: `expect(table.cell(2, 0)).toContainText("Bangladesh")` — timed out, cell doesn't exist
- **Screenshot**: playwright/results/sanity-widgets-table-filter/test-failed-1.png
  - Shows table with "No data" message after filter is applied
- **API response**: GET /api/v1/actions/execute returned 200 with `{ data: [] }`
- **Spec verified correct**: Selector targets the right table, filter UI interaction works (filter chip appears)

### Likely root cause
The execute API returns empty results for the MySQL "starts with" filter. Possible causes:
- Query generation bug in the server's filter-to-SQL translation
- Datasource connection issue (DATASOURCE_HOST may be unreachable from this deployment)

### Reproduction steps
1. Open the app in deployed mode
2. Click "Add Filter" on the data_table widget
3. Set Column: Country, Condition: starts with, Value: Ba
4. Observe: table shows "No data" instead of filtered results

### Suggested investigation
- Check server logs for the execute query
- Verify DATASOURCE_HOST is reachable from the deployment
- Test the same filter on dev.appsmith.com to compare
```

## When Diagnosis Is Inconclusive

If you can't determine whether it's a spec bug or product bug:

```
## Playwright Failure Diagnosis: INCONCLUSIVE

**Spec**: <path>
**Test**: <name>

### What we know
- [facts from error output]

### What we don't know
- [ambiguities]

### Recommended next steps
1. Run the test with `--debug` flag for step-by-step execution
2. Check server logs on the deployment
3. Try reproducing manually in the browser
```
