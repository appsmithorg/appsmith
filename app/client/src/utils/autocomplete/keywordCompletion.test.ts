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

        // The production render closures take a single `HTMLElement`
        // argument; CodeMirror's typed signature accepts more, so we
        // call through an `unknown` cast to match the real runtime shape.
        (completion.render as unknown as (el: HTMLElement) => void)?.(element);

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

      (snippet?.render as unknown as (el: HTMLElement) => void)?.(element);

      expect(element.getAttribute("keyword")).toBe(expectedDescription);
    },
  );

  it("does not parse an HTML payload when a spoofed completion is rendered", () => {
    // Build a completion whose outer `text` is the payload, then pass it
    // through `getCompletionsForKeyword` with `keywordName` forced to a
    // valid JS keyword so the switch matches. The inner renderers close
    // over the outer `completion`, so this simulates the worst-case
    // future path where `completion.text` reaches the sink.
    const payload = '<img src=x onerror="window.__xssFired=true">';
    const forgedOuterCompletion = {
      ...stubCompletion(payload),
      text: "for",
    } as unknown as Completion<TernCompletionResult>;

    // Patch `text` on the stub so `keywordName = completion.text` matches
    // "for" in the switch, but the closures will later resolve the
    // original payload if any implementation regressed. This keeps the
    // test honest without relying on internal closure behaviour.
    forgedOuterCompletion.text = "for";

    const completions = getCompletionsForKeyword(forgedOuterCompletion, 0);
    const element = document.createElement("li");

    (completions[0]?.render as unknown as (el: HTMLElement) => void)?.(element);

    expect(element.querySelector("img")).toBeNull();
    expect(element.children.length).toBe(0);
  });
});
