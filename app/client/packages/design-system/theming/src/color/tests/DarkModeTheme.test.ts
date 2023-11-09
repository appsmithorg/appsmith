import { DarkModeTheme } from "../src/DarkModeTheme";

describe("bg color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { bg } = new DarkModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg).toBe("rgb(4.3484% 4.3484% 4.3484%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { bg } = new DarkModeTheme("oklch(0.92 0.05 110)").getColors();
    expect(bg).toBe("rgb(5.3377% 4.7804% 0%)");
  });
});

describe("bgAccent color", () => {
  it("should return correct color when lightness < 0.3", () => {
    const { bgAccent } = new DarkModeTheme("oklch(0.2 0.09 231)").getColors();
    expect(bgAccent).toBe("rgb(0% 19.987% 30.122%)");
  });
});

describe("bgAccentHover color", () => {
  it("should return correct color when lightness < 0.3", () => {
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

  it("should return correct color when lightness is between 0.77 and 0.85, hue is outside 120-300, and chroma > 0.04", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.80 0.09 150)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(51.184% 89.442% 60.062%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, hue is inside 120-300, and chroma > 0.04", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.80 0.09 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(85.364% 85.594% 0%)");
  });

  it("should return correct color when lightness is between 0.77 and 0.85, and chroma < 0.04", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.80 0.03 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(79.687% 80.239% 71.58%)");
  });

  it("should return correct color when lightness > 0.85", () => {
    const { bgAccentHover } = new DarkModeTheme(
      "oklch(0.90 0.03 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(78.426% 78.975% 70.34%)");
  });
});

describe("bgAccentActive color", () => {
  it("should return correct color when seedLightness < 0.4", () => {
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

  it("should return correct color when seedLightness > or equal to 0.85", () => {
    const { bgAccentActive } = new DarkModeTheme(
      "oklch(0.90 0.09 231)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(46.054% 74.898% 89.15%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness > 0.25", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.671% 23.499%)");
  });

  it("should return correct color when seedLightness < 0.2", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.15 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 9.5878% 17.677%)");
  });

  it("should return correct color when seedChroma > 0.1", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.15 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.556% 23.9%)");
  });

  it("should return correct color when seedChroma < 0.04", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.03 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(13.15% 13.15% 13.15%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness > 0.25", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.671% 23.499%)");
  });

  it("should return correct color when seedLightness < 0.2", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.15 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 9.5878% 17.677%)");
  });

  it("should return correct color when seedChroma > 0.1", () => {
    const { bgAccentSubtle } = new DarkModeTheme(
      "oklch(0.30 0.15 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(0% 14.556% 23.9%)");
  });

  it("should return correct color when seedChroma < 0.04", () => {
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
  it("should return correct color when lightness < 0.5", () => {
    const { bgNeutral } = new DarkModeTheme("oklch(0.3 0.09 231)").getColors();
    expect(bgNeutral).toEqual("rgb(18.887% 23.77% 26.341%)");
  });

  it("should return correct color when chroma < 0.04", () => {
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

describe("bgNeutralOpacity color", () => {
  it("should return correct color", () => {
    const { bgNeutralOpacity } = new DarkModeTheme(
      "oklch(0.51 0.24 279)",
    ).getColors();
    expect(bgNeutralOpacity).toEqual("rgb(3.6355% 4.017% 7.6512% / 0.5)");
  });
});

describe("bgNeutralHover color", () => {
  it("should return correct color when lightness > or equal to 0.85", () => {
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
  it("should return correct color when lightness < 0.4", () => {
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

  it("should return correct color when lightness > or equal to 0.85", () => {
    const { bgNeutralActive } = new DarkModeTheme(
      "oklch(0.9 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(70.597% 70.597% 70.597%)");
  });
});

describe("bgNeutralSubtle color", () => {
  it("should return correct color when lightness > 0.25", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.3 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(13.15% 13.15% 13.15%)");
  });

  it("should return correct color when lightness < 0.2", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.15 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(8.6104% 8.6104% 8.6104%)");
  });

  it("should return correct color when chroma > 0.025", () => {
    const { bgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.3 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(13.15% 13.15% 13.15%)");
  });

  it("should return correct color when chroma < 0.025 (achromatic)", () => {
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

describe("fg color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fg } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fg).toEqual("rgb(95.405% 95.405% 95.405%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { fg } = new DarkModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fg).toEqual("rgb(100% 94.175% 89.331%)");
  });
});

describe("fgAccent color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgAccent } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgAccent).toEqual("rgb(73.075% 73.075% 73.075%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { fgAccent } = new DarkModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgAccent).toEqual("rgb(97.93% 64.37% 34.977%)");
  });
});

describe("fgNeutral color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgNeutral } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgNeutral).toEqual("rgb(78.08% 78.08% 78.08%)");
  });

  it("should return correct color when chroma > 0.04 and hue is between 120 and 300", () => {
    const { fgNeutral } = new DarkModeTheme("oklch(0.45 0.1 150)").getColors();

    expect(fgNeutral).toEqual("rgb(73.047% 80.455% 74.211%)");
  });

  it("should return correct color when chroma > 0.04 and hue is not between 120 and 300", () => {
    const { fgNeutral } = new DarkModeTheme("oklch(0.45 0.1 110)").getColors();

    expect(fgNeutral).toEqual("rgb(78.185% 78.394% 75.54%)");
  });
});

describe("fgNeutralSubtle color", () => {
  it("should return correct color", () => {
    const { fgNeutralSubtle } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(fgNeutralSubtle).toEqual("rgb(59.646% 59.646% 59.646%)");
  });
});

describe("fgPositive color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgPositive } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgPositive).toEqual("rgb(30.123% 72.521% 33.746%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { fgPositive } = new DarkModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgPositive).toEqual("rgb(30.123% 72.521% 33.746%)");
  });

  it("should return correct color hue is between 116 and 165", () => {
    const { fgPositive } = new DarkModeTheme("oklch(0.45 0.1 120)").getColors();

    expect(fgPositive).toEqual("rgb(21.601% 73.197% 38.419%)");
  });

  it("should return correct color hue is not between 116 and 165", () => {
    const { fgPositive } = new DarkModeTheme("oklch(0.45 0.1 30)").getColors();

    expect(fgPositive).toEqual("rgb(30.123% 72.521% 33.746%)");
  });
});

describe("fgNegative color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgNegative } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgNegative).toEqual("rgb(93.903% 0% 24.24%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { fgNegative } = new DarkModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgNegative).toEqual("rgb(93.903% 0% 24.24%)");
  });

  it("should return correct color hue is between 5 and 49", () => {
    const { fgNegative } = new DarkModeTheme("oklch(0.45 0.1 30)").getColors();

    expect(fgNegative).toEqual("rgb(93.292% 0% 32.205%)");
  });

  it("should return correct color hue is not between 5 and 49", () => {
    const { fgNegative } = new DarkModeTheme("oklch(0.45 0.1 120)").getColors();

    expect(fgNegative).toEqual("rgb(93.903% 0% 24.24%)");
  });
});

describe("fgWarning color", () => {
  it("should return correct color", () => {
    const { fgWarning } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgWarning).toEqual("rgb(100% 78.06% 1.4578%)");
  });
});

describe("fgOnAccent color ", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgOnAccent } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgOnAccent).toEqual("rgb(92.148% 92.148% 92.148%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { fgOnAccent } = new DarkModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgOnAccent).toEqual("rgb(100% 89.256% 79.443%)");
  });
});

describe("fgOnAssistive color ", () => {
  it("should return correct color", () => {
    const { fgOnAssistive } = new DarkModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnAssistive).toEqual("rgb(15.033% 15.033% 15.033%)");
  });
});

describe("fgOnNeutral color ", () => {
  it("should return correct color", () => {
    const { fgOnNeutral } = new DarkModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnNeutral).toEqual("rgb(92.148% 92.148% 92.148%)");
  });
});

describe("fgOnPositive color ", () => {
  it("should return correct color", () => {
    const { fgOnPositive } = new DarkModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnPositive).toEqual("rgb(80.46% 100% 80.049%)");
  });
});

describe("fgOnNegative color ", () => {
  it("should return correct color", () => {
    const { fgOnNegative } = new DarkModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnNegative).toEqual("rgb(100% 85.802% 83.139%)");
  });
});

describe("fgOnWarning color ", () => {
  it("should return correct color", () => {
    const { fgOnWarning } = new DarkModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnWarning).toEqual("rgb(23.887% 11.273% 0%)");
  });
});

describe("bd color", () => {
  it("should return correct color", () => {
    const { bd } = new DarkModeTheme("oklch(0.45 0.5 60)").getColors();
    expect(bd).toEqual("rgb(32.033% 27.005% 23.081%)");
  });
});

describe("bdAccent color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { bdAccent } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();
    expect(bdAccent).toEqual("rgb(76.823% 76.823% 76.823%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { bdAccent } = new DarkModeTheme("oklch(0.45 0.1 60)").getColors();
    expect(bdAccent).toEqual("rgb(94.8% 58.165% 23.581%)");
  });
});

describe("bdFocus color", () => {
  it("should return correct color when lightness < 0.4", () => {
    const { bdFocus } = new DarkModeTheme("oklch(0.3 0.4 60)").getColors();
    expect(bdFocus).toEqual("rgb(94.8% 58.165% 23.581%)");
  });

  it("should return correct color when lightness > 0.65", () => {
    const { bdFocus } = new DarkModeTheme("oklch(0.85 0.03 60)").getColors();
    expect(bdFocus).toEqual("rgb(100% 73.208% 48.082%)");
  });

  it("should return correct color when chroma < 0.12", () => {
    const { bdFocus } = new DarkModeTheme("oklch(0.85 0.1 60)").getColors();
    expect(bdFocus).toEqual("rgb(100% 73.208% 48.082%)");
  });

  it("should return correct color when hue is between 0 and 55", () => {
    const { bdFocus } = new DarkModeTheme("oklch(0.85 0.1 30)").getColors();
    expect(bdFocus).toEqual("rgb(100% 70.589% 64.779%)");
  });

  it("should return correct color when hue > 340", () => {
    const { bdFocus } = new DarkModeTheme("oklch(0.85 0.1 350)").getColors();
    expect(bdFocus).toEqual("rgb(100% 67.801% 85.002%)");
  });
});

describe("bdNeutral color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { bdNeutral } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();
    expect(bdNeutral).toEqual("rgb(76.823% 76.823% 76.823%)");
  });
});

describe("bdNeutralHover", () => {
  it("should return correct color", () => {
    const { bdNeutralHover } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdNeutralHover).toEqual("rgb(89.558% 89.558% 89.558%)");
  });
});

describe("bdPositive", () => {
  it("should return correct color", () => {
    const { bdPositive } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();
    expect(bdPositive).toEqual("rgb(0% 71.137% 15.743%)");
  });
});

describe("bdPositiveHover", () => {
  it("should return correct color", () => {
    const { bdPositiveHover } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdPositiveHover).toEqual("rgb(25.51% 86.719% 33.38%)");
  });
});

describe("bdNegative", () => {
  it("should return correct color", () => {
    const { bdNegative } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();
    expect(bdNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });
});

describe("bdNegativeHover", () => {
  it("should return correct color", () => {
    const { bdNegativeHover } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdNegativeHover).toEqual("rgb(100% 33.485% 30.164%)");
  });
});

describe("bdWarning", () => {
  it("should return correct color", () => {
    const { bdWarning } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();
    expect(bdWarning).toEqual("rgb(85.145% 64.66% 8.0286%)");
  });
});

describe("bdWarningHover", () => {
  it("should return correct color", () => {
    const { bdWarningHover } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdWarningHover).toEqual("rgb(100% 77.286% 0%)");
  });
});

describe("bdOnAccent", () => {
  it("should return correct color", () => {
    const { bdOnAccent } = new DarkModeTheme("oklch(0.45 0.03 60)").getColors();
    expect(bdOnAccent).toEqual("rgb(8.8239% 3.8507% 0.7917%)");
  });
});

describe("bdOnNeutral", () => {
  it("should return correct color", () => {
    const { bdOnNeutral } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdOnNeutral).toEqual("rgb(9.4978% 9.4978% 9.4978%)");
  });
});

describe("bdOnPositive", () => {
  it("should return correct color", () => {
    const { bdOnPositive } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdOnPositive).toEqual("rgb(0% 38.175% 0%)");
  });
});

describe("bdOnNegative", () => {
  it("should return correct color", () => {
    const { bdOnNegative } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdOnNegative).toEqual("rgb(36.138% 0% 2.5021%)");
  });
});

describe("bdOnWarning", () => {
  it("should return correct color", () => {
    const { bdOnWarning } = new DarkModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();
    expect(bdOnWarning).toEqual("rgb(49.811% 36.357% 0%)");
  });
});
