import { promptSafe, stripPromptControls } from "./hygiene.js";

// Everything shown in a human approval prompt passes through these. A character that renders as a line break or
// reorders text could make agent-controlled text look like part of the prompt's own wording.
describe("prompt hygiene", () => {
  it.each([
    ["a C0 control", "a\u0001b"],
    ["a newline", "a\nb"],
    ["DEL", "a\u007fb"],
    ["a C1 control", "a\u0085b"],
    ["another C1 control", "a\u009bb"],
    ["U+2028", "a b"],
    ["U+2029", "a b"],
    ["a bidi override", "a‮b"],
    ["a bidi isolate", "a⁦b"],
  ])("strips %s", (_label, text) => {
    expect(stripPromptControls(text)).toBe("ab");
    expect(promptSafe(text)).toBe("ab");
  });

  it("keeps quotes in stripPromptControls and replaces them in promptSafe", () => {
    expect(stripPromptControls('say "hi"')).toBe('say "hi"');
    expect(promptSafe('say "hi"')).toBe("say 'hi'");
  });

  it("keeps ordinary text, including non-Latin letters", () => {
    expect(stripPromptControls("Bestellungen — 注文 é")).toBe(
      "Bestellungen — 注文 é",
    );
  });
});
