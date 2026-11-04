---
name: fix-pw-spec
description: >-
  Fix a failing Playwright spec by analyzing error output, identifying the root
  cause in the test code, and applying corrections. Use when a Playwright test
  fails due to wrong selectors, bad waits, incorrect assertions, or code errors.
  Trigger phrases: "fix this playwright test", "this spec is failing",
  "playwright test broken", "fix the flaky test".
---

# Fix Failing Playwright Spec

## When to Use

This skill fixes **test code bugs** — not product bugs. Use it when:
- A spec you wrote (or someone else wrote) fails due to selectors, waits, or assertion logic
- The product behavior is correct but the test doesn't match it
- Playwright reports timeouts, strict mode violations, or wrong expected values

If the product itself is broken, use `diagnose-pw-failure` instead.

## Step 1 — Gather Failure Context

Read these three things:

1. **The Playwright error output** from the terminal (the test run output)
2. **The spec file** that failed
3. **The trace or screenshot** if available:
   - Traces: `app/client/playwright/results/<test-path>/trace.zip`
   - Screenshots: `app/client/playwright/results/<test-path>/*.png`

## Step 2 — Classify the Error

| Error pattern | Root cause | Fix |
|---------------|-----------|-----|
| `Timeout waiting for locator("...")` | Selector doesn't match any element | Inspect the actual page; update selector |
| `strict mode violation: locator resolved to N elements` | Locator too broad | Add `.first()`, `.nth()`, or refine with chained locators |
| `expect(received).toHaveText("X")` received `"Y"` | Wrong expected value OR wrong element | Verify which element you're targeting; update expected value if test data changed |
| `Target closed` / `page.goto: Navigation failed` | Page navigated away before action completed | Add `waitForResponse` or `waitForURL` before the action |
| `locator.click: Element is not visible` | Element exists but hidden (behind modal, off-screen) | Wait for the right state, scroll into view, or close blocking elements |
| `Cannot find module` / TypeScript error | Import path wrong or missing export | Fix the import path; check that POM/helper exports the symbol |
| `ECONNREFUSED` / `net::ERR_*` | Not a spec bug — deployment issue | Stop. This is not fixable in the spec. |

## Step 3 — Fix Using Conventions

When fixing, follow the project conventions (from `.cursor/rules/playwright.mdc`):

### Selector fixes

Prefer this priority order when replacing a broken selector:

1. `page.getByRole("button", { name: /submit/i })` — best
2. `page.getByPlaceholder("Search...")` — for inputs without proper label association
3. `page.getByTestId("my-element")` — explicit contract
4. `page.locator(SELECTORS.widgetInDeployed("text"))` — Appsmith widget selectors from constants
5. CSS selector with comment — last resort only

**Do not**: Guess selectors. If unsure what's on the page, add a temporary `await page.pause()` or read the component source to find the actual DOM structure.

### Wait fixes

Replace any hard waits or `networkidle` with specific conditions:

```typescript
// Instead of waitForTimeout or networkidle, wait for the element:
await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

// For mutations, wait for the API response:
const response = page.waitForResponse(r => r.url().includes(API.actionsExecute));
await page.getByRole("button", { name: "Save" }).click();
await response;
```

### Assertion fixes

Ensure all assertions use the auto-retrying form:

```typescript
// WRONG — non-retrying
expect(await locator.textContent()).toBe("value");

// RIGHT — auto-retrying
await expect(locator).toHaveText("value");
```

## Step 4 — Re-run and Verify

After fixing, re-run the specific test:

```bash
cd app/client && npx playwright test <spec-file> --project=<project>
```

If it still fails, go back to Step 2 with the new error output.

**Budget**: Max 3 fix attempts per failure. After 3, either:
- The spec is fundamentally wrong (rewrite from scratch)
- The product has a bug (switch to `diagnose-pw-failure`)

## Step 5 — Validate Fix Quality

Before declaring the fix done, check:

- [ ] No `networkidle` introduced
- [ ] No `waitForTimeout` introduced
- [ ] No hardcoded API URLs or CSS selectors
- [ ] Assertions use auto-retrying `expect`
- [ ] No unused imports left behind
- [ ] Run `npx eslint <file> --ext .ts` clean

## Output

Summarize what was wrong and what was fixed:

```
## Spec Fix Summary

**File**: playwright/tests/sanity/widgets/table-filter.spec.ts
**Attempts**: 2

### Fix 1
- **Error**: Timeout waiting for locator `getByRole("button", { name: "Filter" })`
- **Cause**: Button text is "Add Filter", not "Filter"
- **Fix**: Updated to `getByRole("button", { name: /add filter/i })`

### Fix 2
- **Error**: strict mode violation on `.first()` table row
- **Cause**: Filter hadn't applied yet when assertion ran
- **Fix**: Added `waitForResponse` on the execute API before asserting row content

**Result**: PASS
```
