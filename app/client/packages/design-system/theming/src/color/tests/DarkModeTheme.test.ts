import { DarkModeTheme } from "../src/DarkModeTheme";

describe("bg color", () => {
  it("should return correct color when chroma is less than 0.04", () => {
    const { bg } = new DarkModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg).toBe("rgb(4.3484% 4.3484% 4.3484%)");
  });

  it("should return correct color when chroma is greater than 0.04", () => {
    const { bg } = new DarkModeTheme("oklch(0.92 0.05 110)").getColors();
    expect(bg).toBe("rgb(5.3377% 4.7804% 0%)");
  });
});

describe("bgAccent color", () => {
  it("should return correct color when lightness is less than 0.3", () => {
    const { bgAccent } = new DarkModeTheme("oklch(0.2 0.09 231)").getColors();
    expect(bgAccent).toBe("rgb(0% 19.987% 30.122%)");
  });
});

describe("bgAccentHover color", () => {
  it("should return correct color when lightness is less than 0.3", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(0% 25.498% 37.079%)");
  });

  it("should return correct color when lightness is between 0.3 and 0.45", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.35 0.09 231)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(0% 29.954% 42.35%)");
  });

  it("should return correct color when lightness is between 0.45 and 0.77", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.50 0.09 231)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(15.696% 45.773% 58.926%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, hue is outside 120-300, and chroma is greater than 0.04", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.80 0.09 150)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(51.184% 89.442% 60.062%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, hue is inside 120-300, and chroma is greater than 0.04", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.80 0.09 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(85.364% 85.594% 0%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, and chroma is less than 0.04", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.80 0.03 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(79.687% 80.239% 71.58%)");
  });

  it("should return correct color when lightness is greater than 0.85", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.90 0.03 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(78.426% 78.975% 70.34%)");
  });
});

describe("bgAccentActive color", () => {
  it("should return correct color when seedLightness is less than 0.4", () => {
    const { bgAccentActive } = new DarkModeTheme(
      "oklch(0.2 0.09 231)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(0% 17.836% 27.428%)");
  });

  it("should return correct color when seedLightness is between 0.4 and 0.7", () => {
    const { bgAccentActive } = new DarkModeTheme(
      "oklch(0.45 0.09 231)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(0% 32.155% 44.665%)");
  });

  it("should return correct color when seedLightness is between 0.7 and 0.85", () => {
    const { bgAccentActive } = new DarkModeTheme(
      "oklch(0.75 0.09 231)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(37.393% 66.165% 80.119%)");
  });

  it("should return correct color when seedLightness is greater than or equal to 0.85", () => {
    const { bgAccentActive } = new DarkModeTheme(
      "oklch(0.90 0.09 231)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(46.054% 74.898% 89.15%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness is greater than 0.25", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.671% 23.499%)");
  });

  it("should return correct color when seedLightness is less than 0.2", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.15 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 9.5878% 17.677%)");
  });

  it("should return correct color when seedChroma is greater than 0.1", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.15 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.556% 23.9%)");
  });

  it("should return correct color when seedChroma is less than 0.04", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.03 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(13.15% 13.15% 13.15%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness is greater than 0.25", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.671% 23.499%)");
  });

  it("should return correct color when seedLightness is less than 0.2", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.15 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 9.5878% 17.677%)");
  });

  it("should return correct color when seedChroma is greater than 0.1", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.15 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.556% 23.9%)");
  });

  it("should return correct color when seedChroma is less than 0.04", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.03 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(13.15% 13.15% 13.15%)");
  });
});

describe("bgAccentSubtleHover color", () => {
  it("should return correct color for bgAccentSubtleHover1", () => {
    const { bgAccentSubtleHover } = new DarkModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleHover).toBe("rgb(25.181% 12.291% 0%)");
  });
});

describe("bgAccentSubtleActive color", () => {
  it("should return correct color for bgAccentSubtleActive1", () => {
    const { bgAccentSubtleActive } = new DarkModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleActive).toBe("rgb(19.651% 7.4427% 0%)");
  });
});

describe("bgAssistive color", () => {
  it("should return correct color for bgAssistive1 when seed is achromatic", () => {
    const { bgAssistive } = new DarkModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgAssistive).toBe("rgb(92.148% 92.148% 92.148%)");
  });
});

describe("bgNeutral color", () => {
  it("should return correct color when lightness is less than 0.5", () => {
    const { bgNeutral } = new DarkModeTheme("oklch(0.3 0.09 231)").getColors();
    expect(bgNeutral).toEqual("rgb(18.887% 23.77% 26.341%)");
  });

  it("should return correct color when chroma is less than 0.04", () => {
    const { bgNeutral } = new DarkModeTheme("oklch(0.95 0.02 170)").getColors();
    expect(bgNeutral).toEqual("rgb(93.448% 93.448% 93.448%)");
  });

  it("should return correct color when hue is between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral } = new DarkModeTheme("oklch(0.95 0.06 240)").getColors();
    expect(bgNeutral).toEqual("rgb(89.041% 94.38% 98.38%)");
  });

  it("should return correct color when hue is not between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral } = new DarkModeTheme("oklch(0.95 0.06 30)").getColors();
    expect(bgNeutral).toEqual("rgb(96.118% 92.595% 91.947%)");
  });
});

describe("bgNeutralHover color", () => {
  it("should return correct color when lightness is greater than or equal to 0.85", () => {
    const { bgNeutralHover } = new DarkModeTheme(
      "oklch(0.86 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(73.075% 73.075% 73.075%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85", () => {
    const { bgNeutralHover } = new DarkModeTheme(
      "oklch(0.80 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(79.34% 79.34% 79.34%)");
  });

  it("should return correct color when lightness is between 0.45 and 0.77", () => {
    const { bgNeutralHover } = new DarkModeTheme(
      "oklch(0.60 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(53.715% 53.715% 53.715%)");
  });

  it("should return correct color when lightness is between 0.3 and 0.45", () => {
    const { bgNeutralHover } = new DarkModeTheme(
      "oklch(0.35 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(32.307% 32.307% 32.307%)");
  });
});

describe("bgNeutralActive color", () => {
  it("should return correct color when lightness is less than 0.4", () => {
    const { bgNeutralActive } = new DarkModeTheme(
      "oklch(0.39 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(28.06% 28.06% 28.06%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.7", () => {
    const { bgNeutralActive } = new DarkModeTheme(
      "oklch(0.6 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(45.608% 45.608% 45.608%)");
  });

  it("should return correct color when lightness is between 0.7 and 0.85", () => {
    const { bgNeutralActive } = new DarkModeTheme(
      "oklch(0.8 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(68.134% 68.134% 68.134%)");
  });

  it("should return correct color when lightness is greater than or equal to 0.85", () => {
    const { bgNeutralActive } = new DarkModeTheme(
      "oklch(0.9 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(70.597% 70.597% 70.597%)");
  });
});

describe("bgNeutralSubtle color", () => {
  it("should return correct color when lightness is greater than 0.25", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.3 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(13.15% 13.15% 13.15%)");
  });

  it("should return correct color when lightness is less than 0.2", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.15 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(8.6104% 8.6104% 8.6104%)");
  });

  it("should return correct color when chroma is greater than 0.025", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.3 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(13.15% 13.15% 13.15%)");
  });

  it("should return correct color when chroma is less than 0.025 (achromatic)", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.3 0.01 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(13.15% 13.15% 13.15%)");
  });
});
