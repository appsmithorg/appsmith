import { renderKeywordHint } from "./keywordHintRenderer";

// Regression tests for GHSA-vjfq-fvfc-3vjw defense-in-depth.
//
// The JS keyword and tern autocomplete renderers used to write their
// label directly to `innerHTML`. While those label strings are currently
// bounded to JavaScript keyword literals via a surrounding switch, the
// sink pattern matches the one the SQL hint renderer was exploited
// through (GHSA-vjfq-fvfc-3vjw). We consolidate the renderer into a
// single safe utility that writes to `textContent` and set that label
// as the `keyword` attribute, and lock it with these tests.

describe("renderKeywordHint (GHSA-vjfq-fvfc-3vjw defense-in-depth)", () => {
  beforeEach(() => {
    // @ts-expect-error test probe
    delete window.__xssFired;
  });

  it("writes the label as text, not HTML", () => {
    const element = document.createElement("li");
    const label = "for-loop";

    renderKeywordHint(element, label);

    expect(element.children.length).toBe(0);
    expect(element.textContent).toBe(label);
    expect(element.getAttribute("keyword")).toBe(label);
  });

  it("does not parse an HTML payload into the DOM", () => {
    const element = document.createElement("li");
    const payload = '<img src=x onerror="window.__xssFired=true">';

    renderKeywordHint(element, payload);

    expect(element.querySelector("img")).toBeNull();
    expect(element.children.length).toBe(0);
    expect(element.textContent).toBe(payload);
    // @ts-expect-error test probe
    expect(window.__xssFired).toBeUndefined();
  });

  it("does not parse an SVG payload into the DOM", () => {
    const element = document.createElement("li");
    const payload = '<svg onload="window.__xssFired=true"></svg>';

    renderKeywordHint(element, payload);

    expect(element.querySelector("svg")).toBeNull();
    expect(element.children.length).toBe(0);
    expect(element.textContent).toBe(payload);
    // @ts-expect-error test probe
    expect(window.__xssFired).toBeUndefined();
  });

  it("tolerates an empty label without creating empty children", () => {
    const element = document.createElement("li");

    renderKeywordHint(element, "");

    expect(element.children.length).toBe(0);
    expect(element.textContent).toBe("");
    expect(element.getAttribute("keyword")).toBe("");
  });

  it("uses a separate description for the keyword attribute when provided", () => {
    // The CSS rule `.CodeMirror-Tern-completion-keyword[keyword]:after
    // { content: attr(keyword); }` renders the `keyword` attribute as a
    // human-readable suffix. Callers in keywordCompletion.ts pass a
    // descriptive label there (e.g. "For Loop") that is intentionally
    // different from the label rendered inside the hint (e.g. "for").
    const element = document.createElement("li");

    renderKeywordHint(element, "for", "For Loop");

    expect(element.textContent).toBe("for");
    expect(element.getAttribute("keyword")).toBe("For Loop");
    expect(element.children.length).toBe(0);
  });

  it("does not HTML-parse the description either", () => {
    const element = document.createElement("li");
    const payload = '<img src=x onerror="window.__xssFired=true">';

    renderKeywordHint(element, "for", payload);

    // The description is written as an attribute value, which is never
    // parsed as HTML. Confirm it round-trips intact.
    expect(element.getAttribute("keyword")).toBe(payload);
    expect(element.children.length).toBe(0);
    // @ts-expect-error test probe
    expect(window.__xssFired).toBeUndefined();
  });
});
