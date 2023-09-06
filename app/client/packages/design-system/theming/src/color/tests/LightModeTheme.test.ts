import { LightModeTheme } from "../src/LightModeTheme";

describe("@design-system/theming/color/LightModeTheme", () => {
  it("checks bg color", () => {
    // lightness > 0.93
    const { bg: bg1 } = new LightModeTheme("oklch(0.95 0.09 231)").getColors();
    expect(bg1).toBe("rgb(84.831% 87.516% 88.974%)");

    // lightness < 0.93
    const { bg: bg2 } = new LightModeTheme("oklch(0.92 0.09 231)").getColors();
    expect(bg2).toBe("rgb(95.828% 98.573% 100%)");

    // hue > 120 && hue < 300
    const { bg: bg3 } = new LightModeTheme("oklch(0.95 0.07 231)").getColors();
    expect(bg3).toBe("rgb(84.831% 87.516% 88.974%)");

    // hue < 120 or hue > 300
    const { bg: bg4 } = new LightModeTheme("oklch(0.92 0.07 110)").getColors();
    expect(bg4).toBe("rgb(98.101% 98.258% 96.176%)");

    // chroma < 0.04
    const { bg: bg5 } = new LightModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg5).toBe("rgb(98.026% 98.026% 98.026%)");
  });

  it("checks bgAccent color", () => {
    // lightness > 0.93
    const { bgAccent: bgAccent1 } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(bgAccent1).toBe("rgb(91.762% 98.141% 100%)");
  });

  it("checks bgAccentHover color", () => {
    // lightness < 0.06
    const { bgAccentHover: bgAccentHover1 } = new LightModeTheme(
      "oklch(0.05 0.09 231)",
    ).getColors();
    expect(bgAccentHover1).toBe("rgb(0% 23.271% 34.263%)");

    // lightness > 0.06 && lightness < 0.14
    const { bgAccent: bgAccentHover2 } = new LightModeTheme(
      "oklch(0.08 0.09 231)",
    ).getColors();
    expect(bgAccentHover2).toBe("rgb(0% 0% 9.1079%)");

    // lightness > 0.14 && lightness < 0.21 && hue > 120 && hue < 300
    const { bgAccentHover: bgAccentHover3 } = new LightModeTheme(
      "oklch(0.17 0.09 231)",
    ).getColors();
    expect(bgAccentHover3).toBe("rgb(0% 16.773% 26.103%)");

    // lightness > 0.14 && lightness < 0.21 && hue < 120 or hue > 300
    const { bgAccentHover: bgAccentHover4 } = new LightModeTheme(
      "oklch(0.17 0.09 110)",
    ).getColors();
    expect(bgAccentHover4).toBe("rgb(19.339% 18.943% 0%)");

    // lightness > 0.21 && lightness < 0.4
    const { bgAccentHover: bgAccentHover5 } = new LightModeTheme(
      "oklch(0.3 0.09 110)",
    ).getColors();
    expect(bgAccentHover5).toBe("rgb(28.395% 28.425% 0%)");

    // lightness > 0.4 && lightness < 0.7
    const { bgAccentHover: bgAccentHover6 } = new LightModeTheme(
      "oklch(0.5 0.09 110)",
    ).getColors();
    expect(bgAccentHover6).toBe("rgb(45.795% 46.287% 19.839%)");

    // lightness > 0.7
    const { bgAccentHover: bgAccentHover7 } = new LightModeTheme(
      "oklch(0.9 0.09 110)",
    ).getColors();
    expect(bgAccentHover7).toBe("rgb(92.14% 93.271% 65.642%)");

    // lightness > 0.93 && hue > 60 && hue < 115
    const { bgAccentHover: bgAccentHover8 } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();
    expect(bgAccentHover8).toBe("rgb(100% 90.701% 78.457%)");

    // lightness > 0.93 && hue > 116 or hue < 165
    const { bgAccentHover: bgAccentHover9 } = new LightModeTheme(
      "oklch(0.95 0.09 120)",
    ).getColors();
    expect(bgAccentHover9).toBe("rgb(89.886% 97.8% 66.657%)");
  });

  it("checks bgAccentActive color", () => {
    // lightness < 0.4
    const { bgAccentActive: bgAccentActive1 } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentActive1).toBe("rgb(28.712% 15.185% 0%)");

    // lightness >= 0.4 && lightness < 0.7)
    const { bgAccentActive: bgAccentActive2 } = new LightModeTheme(
      "oklch(0.50 0.09 70)",
    ).getColors();
    expect(bgAccentActive2).toBe("rgb(49.27% 32.745% 10.549%)");

    // lightness >= 0.7
    const { bgAccentActive: bgAccentActive3 } = new LightModeTheme(
      "oklch(0.75 0.09 70)",
    ).getColors();
    expect(bgAccentActive3).toBe("rgb(81.395% 63.124% 41.808%)");

    // lightness > 0.93
    const { bgAccentActive: bgAccentActive4 } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();
    expect(bgAccentActive4).toBe("rgb(100% 88.945% 74.563%)");
  });

  it("it checks bgAccentSubtle", () => {
    // seedLightness > 0.93
    const { bgAccentSubtle: bgAccentSubtle1 } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle1).toBe("rgb(85.876% 96.17% 100%)");

    // seedLightness < 0.93
    const { bgAccentSubtle: bgAccentSubtle2 } = new LightModeTheme(
      "oklch(0.92 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle2).toBe("rgb(78.235% 93.705% 100%)");

    // seedChroma > 0.09 && h >= 116 && h <= 165
    const { bgAccentSubtle: bgAccentSubtle3 } = new LightModeTheme(
      "oklch(0.95 0.10 120)",
    ).getColors();
    expect(bgAccentSubtle3).toBe("rgb(90.964% 97.964% 71.119%)");

    // seedChroma > 0.06 && !(h >= 116 && h <= 165)
    const { bgAccentSubtle: bgAccentSubtle4 } = new LightModeTheme(
      "oklch(0.95 0.07 170)",
    ).getColors();
    expect(bgAccentSubtle4).toBe("rgb(75.944% 100% 91.359%)");

    // seedChroma < 0.04
    const { bgAccentSubtle: bgAccentSubtle5 } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgAccentSubtle5).toBe("rgb(94.099% 94.099% 94.099%)");
  });

  it("it checks bgAccentSubtleHover color", () => {
    const { bgAccentSubtleHover: bgAccentSubtleHover1 } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleHover1).toBe("rgb(100% 91.599% 80.256%)");
  });

  it("it checks bgAccentSubtleActive color", () => {
    const { bgAccentSubtleActive: bgAccentSubtleActive1 } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleActive1).toBe("rgb(100% 87.217% 72.911%)");
  });

  it("it checks bgAssistive", () => {
    // seed is achromatic
    const { bgAssistive: bgAssistive1 } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgAssistive1).toBe("rgb(5.1758% 5.1758% 5.1759%)");
  });
});
