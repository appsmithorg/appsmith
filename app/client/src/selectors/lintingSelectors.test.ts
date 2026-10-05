import { getEntityLintErrors } from "./lintingSelectors";
import type { LintError } from "utils/DynamicBindingUtils";

describe("getEntityLintErrors", () => {
  it("returns a shared empty array that callers must not mutate", () => {
    const state = { linting: { errors: {} } } as Parameters<
      typeof getEntityLintErrors
    >[0];

    const first = getEntityLintErrors(state, "customwidget.js");
    const second = getEntityLintErrors(state, "missing.path");

    expect(first).toEqual([]);
    expect(first).toBe(second);

    // Simulate the old CodeEditor.lintCode bug: push onto the shared singleton.
    // If this pollutes the array, later "no error" renders keep stale underlines.
    const customError = { line: 1 } as LintError;
    const merged = [...first, customError];

    expect(merged).toHaveLength(1);
    expect(getEntityLintErrors(state, "customwidget.js")).toHaveLength(0);
  });
});
