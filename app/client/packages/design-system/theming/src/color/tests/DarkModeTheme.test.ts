import { DarkModeTheme } from "../src/DarkModeTheme";

describe("@design-system/theming/color/DarkModeTheme", () => {
  it("checks bg color", () => {
    // chroma < 0.04
    const { bg: bg1 } = new DarkModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg1).toBe("rgb(4.3484% 4.3484% 4.3484%)");

    // chroma > 0.04
    const { bg: bg2 } = new DarkModeTheme("oklch(0.92 0.05 110)").getColors();
    expect(bg2).toBe("rgb(5.3377% 4.7804% 0%)");
  });

  it("checks bgAccent color", () => {
    // lightness < 0.3
    const { bgAccent: bgAccent1 } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccent1).toBe("rgb(0% 19.987% 30.122%)");
  });

  it("checks bgAccentHover color", () => {
    // lightness < 0.3
    const { bgAccentHover: bgAccentHover1 } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccentHover1).toBe("rgb(0% 25.498% 37.079%)");

    // lightness > 0.3 && lightness < 0.45
    const { bgAccent: bgAccentHover2 } = new DarkModeTheme(
      "oklch(0.35 0.09 231)",
    ).getColors();
    expect(bgAccentHover2).toBe("rgb(0% 25.498% 37.079%)");

    // lightness > 0.45 && lightness < 0.77
    const { bgAccentHover: bgAccentHover3 } = new DarkModeTheme(
      "oklch(0.50 0.09 231)",
    ).getColors();
    expect(bgAccentHover3).toBe("rgb(15.696% 45.773% 58.926%)");

    // lightness > 0.77 && lightness < 0.85 && hue > 120 or hue < 300 && chroma > 0.04
    const { bgAccentHover: bgAccentHover4 } = new DarkModeTheme(
      "oklch(0.80 0.09 150)",
    ).getColors();
    expect(bgAccentHover4).toBe("rgb(51.184% 89.442% 60.062%)");

    // l lightness > 0.77 && lightness < 0.85 && hue < 120 or hue > 300 && chroma > 0.04
    const { bgAccentHover: bgAccentHover5 } = new DarkModeTheme(
      "oklch(0.80 0.09 110)",
    ).getColors();
    expect(bgAccentHover5).toBe("rgb(85.364% 85.594% 0%)");

    // lightness > 0.77 && lightness < 0.85 0 && chroma < 0.04
    const { bgAccentHover: bgAccentHover6 } = new DarkModeTheme(
      "oklch(0.80 0.03 110)",
    ).getColors();
    expect(bgAccentHover6).toBe("rgb(79.687% 80.239% 71.58%)");

    // lightness > 0.85
    const { bgAccentHover: bgAccentHover7 } = new DarkModeTheme(
      "oklch(0.90 0.03 110)",
    ).getColors();
    expect(bgAccentHover7).toBe("rgb(78.426% 78.975% 70.34%)");
  });
});
