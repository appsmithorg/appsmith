import { DarkModeTheme } from "../src/DarkModeTheme";

describe("bg color", () => {
  it("should return correct color when chroma is less than 0.04", () => {
    const { bg: bg1 } = new DarkModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg1).toBe("rgb(4.3484% 4.3484% 4.3484%)");
  });

  it("should return correct color when chroma is greater than 0.04", () => {
    const { bg: bg2 } = new DarkModeTheme("oklch(0.92 0.05 110)").getColors();
    expect(bg2).toBe("rgb(5.3377% 4.7804% 0%)");
  });
});

describe("bgAccent color", () => {
  it("should return correct color when lightness is less than 0.3", () => {
    const { bgAccent: bgAccent1 } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccent1).toBe("rgb(0% 19.987% 30.122%)");
  });
});

describe("bgAccentHover color", () => {
  it("should return correct color when lightness is less than 0.3", () => {
    const { bgAccentHover: bgAccentHover1 } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccentHover1).toBe("rgb(0% 25.498% 37.079%)");
  });

  it("should return correct color when lightness is between 0.3 and 0.45", () => {
    const { bgAccentHover: bgAccentHover2 } = new DarkModeTheme(
      "oklch(0.35 0.09 231)",
    ).getColors();
    expect(bgAccentHover2).toBe("rgb(0% 29.954% 42.35%)");
  });

  it("should return correct color when lightness is between 0.45 and 0.77", () => {
    const { bgAccentHover: bgAccentHover3 } = new DarkModeTheme(
      "oklch(0.50 0.09 231)",
    ).getColors();
    expect(bgAccentHover3).toBe("rgb(15.696% 45.773% 58.926%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, hue is outside 120-300, and chroma is greater than 0.04", () => {
    const { bgAccentHover: bgAccentHover4 } = new DarkModeTheme(
      "oklch(0.80 0.09 150)",
    ).getColors();
    expect(bgAccentHover4).toBe("rgb(51.184% 89.442% 60.062%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, hue is inside 120-300, and chroma is greater than 0.04", () => {
    const { bgAccentHover: bgAccentHover5 } = new DarkModeTheme(
      "oklch(0.80 0.09 110)",
    ).getColors();
    expect(bgAccentHover5).toBe("rgb(85.364% 85.594% 0%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, and chroma is less than 0.04", () => {
    const { bgAccentHover: bgAccentHover6 } = new DarkModeTheme(
      "oklch(0.80 0.03 110)",
    ).getColors();
    expect(bgAccentHover6).toBe("rgb(79.687% 80.239% 71.58%)");
  });

  it("should return correct color when lightness is greater than 0.85", () => {
    const { bgAccentHover: bgAccentHover7 } = new DarkModeTheme(
      "oklch(0.90 0.03 110)",
    ).getColors();
    expect(bgAccentHover7).toBe("rgb(78.426% 78.975% 70.34%)");
  });
});

describe("bgAccentActive color", () => {
  it("should return correct color when seedLightness is less than 0.4", () => {
    const { bgAccentActive: bgAccentActive1 } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccentActive1).toBe("rgb(0% 17.836% 27.428%)");
  });

  it("should return correct color when seedLightness is between 0.4 and 0.7", () => {
    const { bgAccentActive: bgAccentActive2 } = new DarkModeTheme(
      "oklch(0.45 0.09 231)",
    ).getColors();
    expect(bgAccentActive2).toBe("rgb(0% 32.155% 44.665%)");
  });

  it("should return correct color when seedLightness is between 0.7 and 0.85", () => {
    const { bgAccentActive: bgAccentActive3 } = new DarkModeTheme(
      "oklch(0.75 0.09 231)",
    ).getColors();
    expect(bgAccentActive3).toBe("rgb(37.393% 66.165% 80.119%)");
  });

  it("should return correct color when seedLightness is greater than or equal to 0.85", () => {
    const { bgAccentActive: bgAccentActive4 } = new DarkModeTheme(
      "oklch(0.90 0.09 231)",
    ).getColors();
    expect(bgAccentActive4).toBe("rgb(46.054% 74.898% 89.15%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness is greater than 0.25", () => {
    const { bgAccentSubtle: bgAccentSubtle1 } = new DarkModeTheme(
      "oklch(0.30 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle1).toBe("rgb(0% 14.671% 23.499%)");
  });

  it("should return correct color when seedLightness is less than 0.2", () => {
    const { bgAccentSubtle: bgAccentSubtle2 } = new DarkModeTheme(
      "oklch(0.15 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle2).toBe("rgb(0% 9.5878% 17.677%)");
  });

  it("should return correct color when seedChroma is greater than 0.1", () => {
    const { bgAccentSubtle: bgAccentSubtle3 } = new DarkModeTheme(
      "oklch(0.30 0.15 231)",
    ).getColors();
    expect(bgAccentSubtle3).toBe("rgb(0% 14.556% 23.9%)");
  });

  it("should return correct color when seedChroma is less than 0.04", () => {
    const { bgAccentSubtle: bgAccentSubtle4 } = new DarkModeTheme(
      "oklch(0.30 0.03 231)",
    ).getColors();
    expect(bgAccentSubtle4).toBe("rgb(13.15% 13.15% 13.15%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness is greater than 0.25", () => {
    const { bgAccentSubtle: bgAccentSubtle1 } = new DarkModeTheme(
      "oklch(0.30 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle1).toBe("rgb(0% 14.671% 23.499%)");
  });

  it("should return correct color when seedLightness is less than 0.2", () => {
    const { bgAccentSubtle: bgAccentSubtle2 } = new DarkModeTheme(
      "oklch(0.15 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle2).toBe("rgb(0% 9.5878% 17.677%)");
  });

  it("should return correct color when seedChroma is greater than 0.1", () => {
    const { bgAccentSubtle: bgAccentSubtle3 } = new DarkModeTheme(
      "oklch(0.30 0.15 231)",
    ).getColors();
    expect(bgAccentSubtle3).toBe("rgb(0% 14.556% 23.9%)");
  });

  it("should return correct color when seedChroma is less than 0.04", () => {
    const { bgAccentSubtle: bgAccentSubtle4 } = new DarkModeTheme(
      "oklch(0.30 0.03 231)",
    ).getColors();
    expect(bgAccentSubtle4).toBe("rgb(13.15% 13.15% 13.15%)");
  });
});

describe("bgAccentSubtleHover color", () => {
  it("should return correct color for bgAccentSubtleHover1", () => {
    const { bgAccentSubtleHover: bgAccentSubtleHover1 } = new DarkModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleHover1).toBe("rgb(25.181% 12.291% 0%)");
  });
});

describe("bgAccentSubtleActive color", () => {
  it("should return correct color for bgAccentSubtleActive1", () => {
    const { bgAccentSubtleActive: bgAccentSubtleActive1 } = new DarkModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleActive1).toBe("rgb(19.651% 7.4427% 0%)");
  });
});

describe("bgAssistive color", () => {
  it("should return correct color for bgAssistive1 when seed is achromatic", () => {
    const { bgAssistive: bgAssistive1 } = new DarkModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgAssistive1).toBe("rgb(92.148% 92.148% 92.148%)");
  });
});
