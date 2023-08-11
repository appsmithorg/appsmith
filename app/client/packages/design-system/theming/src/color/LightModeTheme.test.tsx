import { LightModeTheme } from "./LightModeTheme";

describe("@design-system/theming/color/LightModeTheme", () => {
  it("checks bg color", () => {
    const { bg: veryLightSeedBg } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(veryLightSeedBg).toBe("oklch(0.9 0.009 231)");

    const { bg: notVerylightSeedBg } = new LightModeTheme(
      "oklch(0.92 0.09 231)",
    ).getColors();
    expect(notVerylightSeedBg).toBe("oklch(0.985 0.009 231)");

    const { bg: coldSeedBg } = new LightModeTheme(
      "oklch(0.95 0.07 231)",
    ).getColors();
    expect(coldSeedBg).toBe("oklch(0.9 0.009 231)");

    const { bg: notColdSeedBg } = new LightModeTheme(
      "oklch(0.92 0.07 110)",
    ).getColors();
    expect(notColdSeedBg).toBe("oklch(0.985 0.007 110)");

    const { bg: aChromaticSeedBg } = new LightModeTheme(
      "oklch(0.92 0.02 110)",
    ).getColors();
    expect(aChromaticSeedBg).toBe("oklch(0.985 0 110)");
  });
});
