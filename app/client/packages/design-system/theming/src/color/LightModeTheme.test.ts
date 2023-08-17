import { LightModeTheme } from "./LightModeTheme";

describe("@design-system/theming/color/LightModeTheme", () => {
  it("checks bg color", () => {
    const { bg: veryLightSeedBg } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(veryLightSeedBg).toBe("rgb(84.831% 87.516% 88.974%)");

    const { bg: notVerylightSeedBg } = new LightModeTheme(
      "oklch(0.92 0.09 231)",
    ).getColors();
    expect(notVerylightSeedBg).toBe("rgb(95.828% 98.573% 100%)");

    const { bg: coldSeedBg } = new LightModeTheme(
      "oklch(0.95 0.07 231)",
    ).getColors();
    expect(coldSeedBg).toBe("rgb(84.831% 87.516% 88.974%)");

    const { bg: notColdSeedBg } = new LightModeTheme(
      "oklch(0.92 0.07 110)",
    ).getColors();
    expect(notColdSeedBg).toBe("rgb(98.101% 98.258% 96.176%)");

    const { bg: aChromaticSeedBg } = new LightModeTheme(
      "oklch(0.92 0.02 110)",
    ).getColors();
    expect(aChromaticSeedBg).toBe("rgb(98.026% 98.026% 98.026%)");
  });
});
