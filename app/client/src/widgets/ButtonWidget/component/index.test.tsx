import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "constants/DefaultTheme";
import { BaseButton } from "./index";
import { getSafeCssColor, getSafeFontSize } from "./utils";

const CSS_BREAKOUT_COLOR = "red; } body { background-color: red !important; }";
const CSS_BREAKOUT_FONT_SIZE = "1rem; } .hack { color: blue; }";

function getDocumentCss(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent || "")
    .join("\n");
}

function renderButton(
  props: Partial<React.ComponentProps<typeof BaseButton>> = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <BaseButton text="Submit" {...props} />
    </ThemeProvider>,
  );
}

describe("getSafeCssColor", () => {
  it("accepts valid colors", () => {
    expect(getSafeCssColor("red")).toBe("#ff0000");
    expect(getSafeCssColor("#00ff00")).toBe("#00ff00");
    expect(getSafeCssColor("transparent")).toBe("transparent");
    expect(getSafeCssColor("inherit")).toBe("inherit");
  });

  it("rejects CSS breakout payloads", () => {
    expect(getSafeCssColor(CSS_BREAKOUT_COLOR)).toBeUndefined();
    expect(
      getSafeCssColor("red; background-image: url(https://evil.test)"),
    ).toBeUndefined();
  });
});

describe("getSafeFontSize", () => {
  it("accepts valid font sizes", () => {
    expect(getSafeFontSize("0.875rem")).toBe("0.875rem");
    expect(getSafeFontSize("1.25rem")).toBe("1.25rem");
    expect(getSafeFontSize("14px")).toBe("14px");
    expect(getSafeFontSize("inherit")).toBe("inherit");
  });

  it("rejects CSS breakout payloads", () => {
    expect(getSafeFontSize(CSS_BREAKOUT_FONT_SIZE)).toBeUndefined();
    expect(getSafeFontSize("1rem; } body { color: red; }")).toBeUndefined();
  });
});

describe("ButtonWidget CSS injection", () => {
  it("does not allow labelTextColor to break out of the styled-components rule", () => {
    renderButton({ labelTextColor: CSS_BREAKOUT_COLOR });

    const css = getDocumentCss();

    // Unpatched code emits a scoped breakout rule like: .<hash> body{background-color:red !important;}
    expect(css).not.toMatch(/body\s*\{[^}]*background-color\s*:\s*red/i);
  });

  it("does not allow labelTextSize to break out of the styled-components rule", () => {
    renderButton({ labelTextSize: CSS_BREAKOUT_FONT_SIZE });

    const css = getDocumentCss();

    expect(css).not.toMatch(/\.hack\s*\{[^}]*color\s*:\s*blue/i);
  });

  it("still applies a valid labelTextColor", () => {
    const { container } = renderButton({ labelTextColor: "#ff0000" });
    const label = container.querySelector(".bp3-button-text");

    expect(label).not.toBeNull();
    expect(getComputedStyle(label as Element).color).toBe("rgb(255, 0, 0)");
  });

  it("still applies a valid labelTextSize", () => {
    const { container } = renderButton({ labelTextSize: "1.25rem" });
    const label = container.querySelector(".bp3-button-text");

    expect(label).not.toBeNull();
    expect(getComputedStyle(label as Element).fontSize).toBe("1.25rem");
  });

  it("applies italic style and end padding so glyphs are not clipped", () => {
    const { container } = renderButton({ labelStyle: "ITALIC" });
    const label = container.querySelector(".bp3-button-text");

    expect(label).not.toBeNull();
    expect(getComputedStyle(label as Element).fontStyle).toBe("italic");
    expect(getComputedStyle(label as Element).paddingInlineEnd).toBe("0.25em");
  });
});
