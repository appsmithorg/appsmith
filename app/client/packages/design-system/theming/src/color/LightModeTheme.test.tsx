import { LightModeTheme } from "./LightModeTheme";

describe("@design-system/theming/color/LightModeTheme", () => {
  it("checks bg color", () => {
    // seed is very light
    const veryLightSeed = new LightModeTheme("oklch(94% 0.03 231)").bg;
    expect(veryLightSeed.oklch.l).toBe(0.9);

    // seed is not very light
    const notVeryLightSeed = new LightModeTheme("oklch(90% 0.03 231)").bg;
    expect(notVeryLightSeed.oklch.l).toBe(0.985);

    const coldSeed = new LightModeTheme("oklch(90% 0.07 231)").bg;
    expect(coldSeed.oklch.c).toBe(0.009);

    const notColdSeed = new LightModeTheme("oklch(90% 0.07 110)").bg;
    expect(notColdSeed.oklch.c).toBe(0.007);

    const aChromaticSeed = new LightModeTheme("oklch(90% 0.02 110)").bg;
    expect(aChromaticSeed.oklch.c).toBe(0);
  });
});
