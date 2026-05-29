import { generateAppsmithCssVariables } from "widgets/wds/WDSCustomWidget/component/customWidgetscript";
import { generateAppsmithCssVariables as generateAppsmithCssVariablesLegacy } from "widgets/CustomWidget/component/customWidgetscript";

const implementations = [
  ["WDSCustomWidget", generateAppsmithCssVariables],
  ["CustomWidget (legacy)", generateAppsmithCssVariablesLegacy],
];

describe.each(implementations)(
  "generateAppsmithCssVariables (%s)",
  (_label, fn) => {
    const provider = "model";

    beforeEach(() => {
      document.head.innerHTML = "";
      document.body.innerHTML = "";
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("creates a style element with correct CSS custom properties", () => {
      const apply = fn(provider);

      apply({ color: "red", size: 16 });

      const style = document.getElementById(`appsmith-${provider}-css-tokens`);

      expect(style).not.toBeNull();
      expect(style.tagName).toBe("STYLE");
      expect(document.head.contains(style)).toBe(true);

      const text = style.textContent;

      expect(text).toContain("--appsmith-model-color: red;");
      expect(text).toContain("--appsmith-model-size: 16;");
      expect(text).toContain(":root");
    });

    it("reuses the existing style element on subsequent calls", () => {
      const apply = fn(provider);

      apply({ a: "1" });
      apply({ b: "2" });

      const styles = document.querySelectorAll(
        `#appsmith-${provider}-css-tokens`,
      );

      expect(styles.length).toBe(1);
      expect(styles[0].textContent).toContain("--appsmith-model-b: 2;");
    });

    it("skips non-primitive values", () => {
      const apply = fn(provider);

      apply({ ok: "yes", nested: { deep: true }, arr: [1, 2] });

      const text = document.getElementById(
        `appsmith-${provider}-css-tokens`,
      ).textContent;

      expect(text).toContain("--appsmith-model-ok: yes;");
      expect(text).not.toContain("nested");
      expect(text).not.toContain("arr");
    });

    // jsdom does not reproduce browser HTML-injection behavior for <style>
    // elements (innerHTML on a raw-text element stays as text in jsdom), so
    // checking for injected DOM nodes is insufficient.  Instead we assert
    // that the unsafe API (innerHTML) is never called on a <style> element.
    // Current code uses innerHTML → these tests FAIL (RED).
    // After switching to textContent → they PASS (GREEN).

    it("does NOT inject a <script> element via style breakout (XSS)", () => {
      const spy = jest.spyOn(Element.prototype, "innerHTML", "set");

      const apply = fn(provider);

      apply({
        malicious: "red; } </style><script>alert(1)</script>",
      });

      const styleSetterCalls = spy.mock.contexts.filter(
        (ctx) => ctx?.tagName === "STYLE",
      );

      expect(styleSetterCalls).toHaveLength(0);
    });

    it("does NOT inject an <img> element via HTML injection (XSS)", () => {
      const spy = jest.spyOn(Element.prototype, "innerHTML", "set");

      const apply = fn(provider);

      apply({
        exploit: '<img src=x onerror="alert(1)">',
      });

      const styleSetterCalls = spy.mock.contexts.filter(
        (ctx) => ctx?.tagName === "STYLE",
      );

      expect(styleSetterCalls).toHaveLength(0);
    });
  },
);
