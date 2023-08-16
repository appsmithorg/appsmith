import { DarkModeTheme } from "./DarkModeTheme";

describe("@design-system/theming/color/DarkModeTheme", () => {
  it("checks bg color", () => {
    const { bg: aChromaticSeedBg } = new DarkModeTheme(
      "oklch(0.92 0.02 110)",
    ).getColors();
    expect(aChromaticSeedBg).toBe("rgb(4.3484% 4.3484% 4.3484%)");

    const { bg: notAChromaticSeedBg } = new DarkModeTheme(
      "oklch(0.92 0.05 110)",
    ).getColors();
    expect(notAChromaticSeedBg).toBe("rgb(5.3377% 4.7804% 0%)");
  });
});
