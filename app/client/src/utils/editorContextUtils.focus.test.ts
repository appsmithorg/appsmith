import { getPropertyControlFocusElement } from "./editorContextUtils";

/** Builds a property control wrapper: a label row, then the control part. */
function buildWrapper(controlHtml: string): HTMLElement {
  const wrapper = document.createElement("div");

  wrapper.innerHTML = `<div class="label-row"></div>${controlHtml}`;

  return wrapper;
}

describe("getPropertyControlFocusElement", () => {
  it("returns the read-only value block of a disabled control", () => {
    const wrapper = buildWrapper(
      '<pre data-testid="t--property-control-disabled-value" tabindex="0">.x {}</pre>',
    );

    const result = getPropertyControlFocusElement(wrapper);

    expect(result?.getAttribute("data-testid")).toBe(
      "t--property-control-disabled-value",
    );
  });

  it("still returns the input inside a normal control", () => {
    const wrapper = buildWrapper(
      '<div tabindex="0"><input data-testid="inner-input" /></div>',
    );

    const result = getPropertyControlFocusElement(wrapper);

    expect(result?.getAttribute("data-testid")).toBe("inner-input");
  });

  it("returns undefined when the control part has nothing to focus", () => {
    const wrapper = buildWrapper("<div><span>text</span></div>");

    expect(getPropertyControlFocusElement(wrapper)).toBeUndefined();
  });
});
