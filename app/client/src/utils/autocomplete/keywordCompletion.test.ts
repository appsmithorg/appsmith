import { getCompletionsForKeyword } from "./keywordCompletion";
import type { Completion, TernCompletionResult } from "./CodemirrorTernService";

// Regression tests for GHSA-vjfq-fvfc-3vjw defense-in-depth.
//
// `getCompletionsForKeyword` produces CodeMirror completion objects
// whose `render` closures used to write their label to `element.innerHTML`.
// Label strings are either hardcoded literals or `completion.text`, and
// `completion.text` is gated by an outer `switch` that only matches a
// fixed set of JS keywords, so there is no current exploit path. The
// sink pattern, however, is the one GHSA-vjfq-fvfc-3vjw exploited in
// the SQL hint renderer. These tests lock every keyword variant to
// text-only rendering so the pattern cannot come back.

function stubCompletion(text: string): Completion<TernCompletionResult> {
  return {
    text,
    displayText: text,
    className: "CodeMirror-hint-keyword",
    data: {} as unknown as TernCompletionResult,
    origin: "test",
    render: undefined,
    type: "keyword",
  } as unknown as Completion<TernCompletionResult>;
}

const KEYWORDS = [
  "for",
  "while",
  "do",
  "if",
  "switch",
  "function",
  "try",
  "throw",
  "new",
  "async",
];

describe("getCompletionsForKeyword (GHSA-vjfq-fvfc-3vjw defense-in-depth)", () => {
  it.each(KEYWORDS)(
    "every render closure for '%s' produces text-only output",
    (keyword) => {
      const completions = getCompletionsForKeyword(stubCompletion(keyword), 0);

      expect(completions.length).toBeGreaterThan(0);

      for (const completion of completions) {
        const element = document.createElement("li");

        completion.render?.(element, undefined, completion);

        expect(element.children.length).toBe(0);
        expect(element.textContent ?? "").not.toBe("");
        expect(element.getAttribute("keyword")).not.toBeNull();
      }
    },
  );

  // The CSS `content: attr(keyword)` rule renders the descriptive label
  // as a suffix next to the hint. This regression test pins that the
  // refactored renderer continues to set the same per-keyword label the
  // inline renderers used before the GHSA-vjfq-fvfc-3vjw hardening, so
  // users keep seeing e.g. "For Loop" next to a `for` hint.
  it.each<[string, string, string]>([
    ["for", "for-loop", "For Loop"],
    ["while", "while-loop", "While Statement"],
    ["do", "do-while-statement", "do-While Statement"],
    ["if", "if-statement", "if Statement"],
    ["switch", "switch-statement", "Switch Statement"],
    ["function", "function-statement", "Function Statement"],
    ["try", "try-catch", "Try-catch Statement"],
    ["throw", "throw-exception", "Throw Exception"],
    ["new", "new-statement", "new Statement"],
  ])(
    "preserves the descriptive label for keyword '%s' / snippet '%s'",
    (keyword, snippetName, expectedDescription) => {
      const completions = getCompletionsForKeyword(stubCompletion(keyword), 0);
      const snippet = completions.find((c) => c.name === snippetName);

      expect(snippet).toBeDefined();

      const element = document.createElement("li");

      snippet?.render?.(element, undefined, snippet);

      expect(element.getAttribute("keyword")).toBe(expectedDescription);
    },
  );

  it("does not parse an HTML payload even when completion.text is spoofed", () => {
    // This branch cannot happen through the production caller (the outer
    // switch only matches literal JS keywords), but the closure itself
    // must still refuse to parse markup — otherwise any future path that
    // reuses the closure with attacker-controlled text would be a sink.
    const payload = '<img src=x onerror="window.__xssFired=true">';

    const completions = getCompletionsForKeyword(stubCompletion("for"), 0);
    const element = document.createElement("li");

    completions[0].render?.(element, undefined, {
      ...completions[0],
      text: payload,
      displayText: payload,
    });

    expect(element.querySelector("img")).toBeNull();
    expect(element.children.length).toBe(0);
  });
});
