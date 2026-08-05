import {
  buildWidgetAIContext,
  extractCodeUpdates,
  stripCodeUpdates,
} from "./utils";

describe("AIAssistant utils", () => {
  describe("extractCodeUpdates", () => {
    it("extracts html, css and js blocks", () => {
      const content = [
        "Here is your widget:",
        "```html",
        "<div id='app'></div>",
        "```",
        "```css",
        ".app { color: red; }",
        "```",
        "```js",
        "appsmith.onReady(() => {});",
        "```",
      ].join("\n");

      expect(extractCodeUpdates(content)).toEqual({
        html: "<div id='app'></div>",
        css: ".app { color: red; }",
        js: "appsmith.onReady(() => {});",
      });
    });

    it("leaves illustrative javascript snippets out of file updates", () => {
      const content = "```javascript\nconst a = 1;\n```";

      expect(extractCodeUpdates(content)).toEqual({});
    });

    it("returns partial updates when only some files are present", () => {
      const content = "Tweak the styles:\n```css\nbody { margin: 0; }\n```";

      expect(extractCodeUpdates(content)).toEqual({
        css: "body { margin: 0; }",
      });
    });

    it("ignores untagged and unrelated code blocks", () => {
      const content = [
        "```",
        "plain snippet",
        "```",
        "```python",
        "print('hi')",
        "```",
      ].join("\n");

      expect(extractCodeUpdates(content)).toEqual({});
    });

    it("keeps the last block when a tag appears twice", () => {
      const content = [
        "```css",
        ".old {}",
        "```",
        "```css",
        ".new {}",
        "```",
      ].join("\n");

      expect(extractCodeUpdates(content)).toEqual({ css: ".new {}" });
    });

    it("ignores empty blocks", () => {
      const content = "```html\n\n```";

      expect(extractCodeUpdates(content)).toEqual({});
    });

    it("handles indented fences inside the block body", () => {
      const content = [
        "```js",
        "const template = `",
        "  some text",
        "`;",
        "```",
      ].join("\n");

      expect(extractCodeUpdates(content)).toEqual({
        js: "const template = `\n  some text\n`;",
      });
    });

    it("restores markdown fences escaped in the AI context", () => {
      const escapedFence = "`\u200b``";
      const content = [
        "```js",
        `const markdown = '${escapedFence}js';`,
        "```",
      ].join("\n");

      expect(extractCodeUpdates(content)).toEqual({
        js: "const markdown = '```js';",
      });
    });

    it("returns an empty object for empty content", () => {
      expect(extractCodeUpdates("")).toEqual({});
    });
  });

  describe("stripCodeUpdates", () => {
    it("removes applied blocks but keeps the explanation", () => {
      const content = [
        "I built a counter widget.",
        "",
        "```html",
        "<div id='app'></div>",
        "```",
        "",
        "Click the button to increment.",
      ].join("\n");

      expect(stripCodeUpdates(content)).toBe(
        "I built a counter widget.\n\nClick the button to increment.",
      );
    });

    it("keeps non-file code blocks", () => {
      const content = [
        "Use this in a query:",
        "```sql",
        "SELECT 1;",
        "```",
      ].join("\n");

      expect(stripCodeUpdates(content)).toBe(content);
    });
  });

  describe("buildWidgetAIContext", () => {
    it("includes the current code of all three files", () => {
      const context = buildWidgetAIContext({
        html: "<div>hello</div>",
        css: ".a {}",
        js: "console.log(1);",
      });

      expect(context).toContain("<div>hello</div>");
      expect(context).toContain(".a {}");
      expect(context).toContain("console.log(1);");
    });

    it("marks missing files as empty and never emits triple backticks", () => {
      const context = buildWidgetAIContext(undefined);

      expect(context).toContain("(empty)");
      // The server wraps this string in a fenced block; a fence inside would
      // break the prompt structure.
      expect(context).not.toContain("```");
    });

    it("breaks markdown fences embedded in the widget source", () => {
      const context = buildWidgetAIContext({
        html: "<pre>```html</pre>",
        css: "/* ``` */",
        js: "const markdown = '```js';",
      });

      expect(context).not.toContain("```");
      expect(context).toContain("<pre>`\u200b``html</pre>");
      expect(context).toContain("/* `\u200b`` */");
      expect(context).toContain("const markdown = '`\u200b``js';");
    });
  });
});
