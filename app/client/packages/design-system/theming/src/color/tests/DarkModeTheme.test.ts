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

describe("bgNeutralSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgNeutralSubtleHover } = new DarkModeTheme(
      "oklch(0.3 0.01 170)",
    ).getColors();
    expect(bgNeutralSubtleHover).toEqual("rgb(15.988% 15.988% 15.988%)");
  });
});

describe("bgNeutralSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgNeutralSubtleActive } = new DarkModeTheme(
      "oklch(0.3 0.01 170)",
    ).getColors();
    expect(bgNeutralSubtleActive).toEqual("rgb(11.304% 11.304% 11.304%)");
  });
});

describe("bgPositive color", () => {
  it("should return correct color when seed color is green (hue between 116 and 165) and chroma > 0.09", () => {
    const { bgPositive } = new DarkModeTheme(
      "oklch(0.62 0.17 145)",
    ).getColors();
    expect(bgPositive).toEqual("rgb(33.244% 60.873% 10.585%)");
  });

  it("should return correct color when seed color is green (hue between 116 and 165) but chroma is 0.08", () => {
    const { bgPositive } = new DarkModeTheme(
      "oklch(0.62 0.08 145)",
    ).getColors();
    expect(bgPositive).toEqual("rgb(18.515% 62.493% 23.87%)");
  });

  it("should return correct color when seed color is not green (hue outside 116-165) and chroma > 0.09", () => {
    const { bgPositive } = new DarkModeTheme(
      "oklch(0.62 0.17 100)",
    ).getColors();
    expect(bgPositive).toEqual("rgb(18.515% 62.493% 23.87%)");
  });

  it("should return correct color when seed color is not green (hue outside 116-165) and chroma is 0.08", () => {
    const { bgPositive } = new DarkModeTheme(
      "oklch(0.62 0.08 100)",
    ).getColors();
    expect(bgPositive).toEqual("rgb(18.515% 62.493% 23.87%)");
  });
});

describe("bgPositiveHover color", () => {
  it("should return correct color", () => {
    const { bgPositiveHover } = new DarkModeTheme(
      "oklch(0.62 0.17 145)",
    ).getColors();
    expect(bgPositiveHover).toEqual("rgb(36.781% 64.586% 15.952%)");
  });
});

describe("bgPositiveActive color", () => {
  it("should return correct color", () => {
    const { bgPositiveActive } = new DarkModeTheme(
      "oklch(0.62 0.17 145)",
    ).getColors();
    expect(bgPositiveActive).toEqual("rgb(28.549% 55.976% 0%)");
  });
});

describe("bgPositiveSubtle color", () => {
  it("should return correct color", () => {
    const { bgPositiveSubtle } = new DarkModeTheme(
      "oklch(0.62 0.17 145)",
    ).getColors();
    expect(bgPositiveSubtle).toEqual("rgb(7.8895% 15.556% 2.8063%)");
  });
});

describe("bgPositiveSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgPositiveSubtleHover } = new DarkModeTheme(
      "oklch(0.62 0.17 145)",
    ).getColors();
    expect(bgPositiveSubtleHover).toEqual("rgb(10.689% 18.514% 5.7924%)");
  });
});

describe("bgPositiveSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgPositiveSubtleActive } = new DarkModeTheme(
      "oklch(0.62 0.17 145)",
    ).getColors();
    expect(bgPositiveSubtleActive).toEqual("rgb(6.0555% 13.622% 1.2799%)");
  });
});

describe("bgNegative color", () => {
  it("should return correct color when seed color is red (hue between 5 and 49) and chroma > 0.07", () => {
    const { bgNegative } = new DarkModeTheme("oklch(0.55 0.22 27)").getColors();
    expect(bgNegative).toEqual("rgb(83.034% 1.7746% 18.798%)");
  });

  it("should return correct color when seed color is red (hue between 5 and 49) but chroma is not greater than 0.07", () => {
    const { bgNegative } = new DarkModeTheme("oklch(0.55 0.05 27)").getColors();
    expect(bgNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });

  it("should return correct color when seed color is not red (hue outside 5-49) and chroma > 0.07", () => {
    const { bgNegative } = new DarkModeTheme("oklch(0.55 0.22 60)").getColors();
    expect(bgNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });

  it("should return correct color when seed color is not red (hue outside 5-49) and chroma is not greater than 0.07", () => {
    const { bgNegative } = new DarkModeTheme("oklch(0.55 0.05 60)").getColors();
    expect(bgNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });
});

describe("bgNegativeHover color", () => {
  it("should return correct color", () => {
    const { bgNegativeHover } = new DarkModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();
    expect(bgNegativeHover).toEqual("rgb(87.347% 11.876% 22.315%)");
  });
});

describe("bgNegativeActive color", () => {
  it("should return correct color", () => {
    const { bgNegativeActive } = new DarkModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();
    expect(bgNegativeActive).toEqual("rgb(77.305% 0% 13.994%)");
  });
});

describe("bgNegativeSubtle color", () => {
  it("should return correct color", () => {
    const { bgNegativeSubtle } = new DarkModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();
    expect(bgNegativeSubtle).toEqual("rgb(77.305% 0% 13.994%)");
  });
});

describe("bgNegativeSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgNegativeSubtleHover } = new DarkModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();
    expect(bgNegativeSubtleHover).toEqual("rgb(29.827% 6.1224% 7.5796%)");
  });
});

describe("bgNegativeSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgNegativeSubtleActive } = new DarkModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();
    expect(bgNegativeSubtleActive).toEqual("rgb(24.04% 0.5234% 2.9937%)");
  });
});

describe("bgWarning color", () => {
  it("should return correct color when seed color is yellow (hue between 60 and 115) and chroma > 0.09", () => {
    const { bgWarning } = new DarkModeTheme("oklch(0.75 0.15 85)").getColors();
    expect(bgWarning).toEqual("rgb(91.527% 60.669% 16.491%)");
  });

  it("should return correct color when seed color is yellow (hue between 60 and 115) but chroma is not greater than 0.09", () => {
    const { bgWarning } = new DarkModeTheme("oklch(0.75 0.05 85)").getColors();
    expect(bgWarning).toEqual("rgb(85.145% 64.66% 8.0286%)");
  });

  it("should return correct color when seed color is not yellow (hue outside 60-115) and chroma > 0.09", () => {
    const { bgWarning } = new DarkModeTheme("oklch(0.75 0.15 50)").getColors();
    expect(bgWarning).toEqual("rgb(85.145% 64.66% 8.0286%)");
  });

  it("should return correct color when seed color is not yellow (hue outside 60-115) and chroma is not greater than 0.09", () => {
    const { bgWarning } = new DarkModeTheme("oklch(0.75 0.05 50)").getColors();
    expect(bgWarning).toEqual("rgb(85.145% 64.66% 8.0286%)");
  });
});

describe("bgWarningHover color", () => {
  it("should return correct color", () => {
    const { bgWarningHover } = new DarkModeTheme(
      "oklch(0.75 0.05 50)",
    ).getColors();
    expect(bgWarningHover).toEqual("rgb(90.341% 69.671% 17.643%)");
  });
});

describe("bgWarningActive color", () => {
  it("should return correct color", () => {
    const { bgWarningActive } = new DarkModeTheme(
      "oklch(0.75 0.05 50)",
    ).getColors();
    expect(bgWarningActive).toEqual("rgb(78.726% 58.477% 0%)");
  });
});

describe("bgWarningSubtle color", () => {
  it("should return correct color", () => {
    const { bgWarningSubtle } = new DarkModeTheme(
      "oklch(0.75 0.05 50)",
    ).getColors();
    expect(bgWarningSubtle).toEqual("rgb(16.622% 12.537% 3.3792%)");
  });
});

describe("bgWarningSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgWarningSubtleHover } = new DarkModeTheme(
      "oklch(0.75 0.05 50)",
    ).getColors();
    expect(bgWarningSubtleHover).toEqual("rgb(19.571% 15.398% 6.3225%)");
  });
});

describe("bgWarningSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgWarningSubtleActive } = new DarkModeTheme(
      "oklch(0.75 0.05 50)",
    ).getColors();
    expect(bgWarningSubtleActive).toEqual("rgb(14.696% 10.673% 1.7722%)");
  });
});
