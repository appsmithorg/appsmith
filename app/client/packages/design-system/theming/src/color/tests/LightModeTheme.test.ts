import { LightModeTheme } from "../src/LightModeTheme";

describe("bg color", () => {
  it("should return correct color when lightness > 0.93", () => {
    const { bg } = new LightModeTheme("oklch(0.95 0.09 231)").getColors();

    expect(bg).toBe("rgb(95.576% 96.181% 96.511%)");
  });

  it("should return correct color when lightness < 0.93", () => {
    const { bg } = new LightModeTheme("oklch(0.92 0.09 231)").getColors();

    expect(bg).toBe("rgb(95.576% 96.181% 96.511%)");
  });

  it("should return correct color when hue > 120 && hue < 300", () => {
    const { bg } = new LightModeTheme("oklch(0.95 0.07 231)").getColors();

    expect(bg).toBe("rgb(95.576% 96.181% 96.511%)");
  });

  it("should return correct color when hue < 120 or hue > 300", () => {
    const { bg } = new LightModeTheme("oklch(0.92 0.07 110)").getColors();

    expect(bg).toBe("rgb(96.069% 96.092% 95.796%)");
  });

  it("should return correct color when chroma < 0.04", () => {
    const { bg } = new LightModeTheme("oklch(0.92 0.02 110)").getColors();

    expect(bg).toBe("rgb(96.059% 96.059% 96.059%)");
  });
});

describe("bgAccent color", () => {
  it("should return correct color when lightness > 0.93", () => {
    const { bgAccent } = new LightModeTheme("oklch(0.95 0.09 231)").getColors();

    expect(bgAccent).toBe("rgb(39.906% 72.747% 88.539%)");
  });
});

describe("bgAccentHover color", () => {
  it("should return correct color when lightness < 0.06", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.05 0.09 231)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(0% 23.472% 35.518%)");
  });

  it("should return correct color when lightness is between 0.06 and 0.14", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.08 0.09 231)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(0% 18.133% 28.462%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21 and hue is between 120 and 300", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.17 0.09 231)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(0% 17.091% 27.078%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21 and hue is not between 120 and 300", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.17 0.09 110)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(19.253% 19.006% 0%)");
  });

  it("should return correct color when lightness is between 0.21 and 0.4", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.3 0.09 110)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(28.395% 28.425% 0%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.7", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.5 0.09 110)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(45.795% 46.287% 19.839%)");
  });

  it("should return correct color when lightness >  0.7", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.9 0.09 110)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(92.14% 93.271% 65.642%)");
  });

  it("should return correct color when lightness >  0.93 and hue is between 60 and 115", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(88.091% 67.511% 43.309%)");
  });

  it("should return correct color when lightness >  0.93 and hue is not between 116 and 165", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.95 0.09 120)",
    ).getColors();

    expect(bgAccentHover).toBe("rgb(68.605% 75.736% 46.633%)");
  });
});

describe("bgAccentActive color", () => {
  it("should return correct color when lightness < 0.4", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();

    expect(bgAccentActive).toBe("rgb(29.443% 14.834% 0%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.7", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.50 0.09 70)",
    ).getColors();

    expect(bgAccentActive).toBe("rgb(49.27% 32.745% 10.549%)");
  });

  it("should return correct color when lightness >  or equal to 0.7", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.75 0.09 70)",
    ).getColors();

    expect(bgAccentActive).toBe("rgb(81.395% 63.124% 41.808%)");
  });

  it("should return correct color when lightness >  0.93", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();

    expect(bgAccentActive).toBe("rgb(82.901% 62.578% 38.456%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness >  0.93", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();

    expect(bgAccentSubtle).toBe("rgb(80.68% 97.025% 100%)");
  });

  it("should return correct color when seedLightness < 0.93", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.92 0.09 231)",
    ).getColors();

    expect(bgAccentSubtle).toBe("rgb(73.159% 94.494% 100%)");
  });

  it("should return correct color when seedChroma >  0.09 and hue is between 116 and 165", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.10 120)",
    ).getColors();

    expect(bgAccentSubtle).toBe("rgb(90.964% 97.964% 71.119%)");
  });

  it("should return correct color when seedChroma >  0.06 and hue is not between 116 and 165", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.07 170)",
    ).getColors();

    expect(bgAccentSubtle).toBe("rgb(75.944% 100% 91.359%)");
  });

  it("should return correct color when seedChroma < 0.04", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();

    expect(bgAccentSubtle).toBe("rgb(94.099% 94.099% 94.099%)");
  });
});

describe("bgAccentSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgAccentSubtleHover } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();

    expect(bgAccentSubtleHover).toBe("rgb(100% 91.101% 76.695%)");
  });
});

describe("bgAccentSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgAccentSubtleActive } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();

    expect(bgAccentSubtleActive).toBe("rgb(100% 87.217% 72.911%)");
  });
});

describe("bgAssistive color", () => {
  it("should return correct color when seed is achromatic", () => {
    const { bgAssistive } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();

    expect(bgAssistive).toBe("rgb(5.1758% 5.1758% 5.1758%)");
  });
});

describe("bgNeutral color", () => {
  it("should return correct color when lightness > 0.85", () => {
    const { bgNeutral } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();

    expect(bgNeutral).toEqual("rgb(0% 0% 0%)");
  });

  it("should return correct color when lightness is between 0.25 and 0.85", () => {
    const { bgNeutral } = new LightModeTheme("oklch(0.5 0.09 231)").getColors();

    expect(bgNeutral).toEqual("rgb(4.0418% 4.4239% 4.6309%)");
  });

  it("should return correct color when chroma < 0.04", () => {
    const { bgNeutral } = new LightModeTheme(
      "oklch(0.95 0.02 170)",
    ).getColors();

    expect(bgNeutral).toEqual("rgb(0% 0% 0%)");
  });

  it("should return correct color when hue is between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral } = new LightModeTheme(
      "oklch(0.95 0.06 240)",
    ).getColors();

    expect(bgNeutral).toEqual("rgb(0% 0% 0%)");
  });

  it("should return correct color when hue is not between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral } = new LightModeTheme("oklch(0.95 0.06 30)").getColors();

    expect(bgNeutral).toEqual("rgb(0% 0% 0%)");
  });
});

describe("bgNeutralOpacity color", () => {
  it("should return correct color", () => {
    const { bgNeutralOpacity } = new LightModeTheme(
      "oklch(0.51 0.24 279)",
    ).getColors();

    expect(bgNeutralOpacity).toEqual("rgb(4.2704% 4.3279% 4.6942% / 0.6)");
  });
});

describe("bgNeutralHover color", () => {
  it("should return correct color when lightness < 0.06", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.05 0.03 170)",
    ).getColors();

    expect(bgNeutralHover).toEqual("rgb(22.901% 22.901% 22.901%)");
  });

  it("should return correct color when lightness is between 0.06 and 0.14", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.10 0.03 170)",
    ).getColors();

    expect(bgNeutralHover).toEqual("rgb(16.952% 16.952% 16.952%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.17 0.03 170)",
    ).getColors();

    expect(bgNeutralHover).toEqual("rgb(15.988% 15.988% 15.988%)");
  });

  it("should return correct color when lightness is between 0.21 and 0.7", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.35 0.03 170)",
    ).getColors();

    expect(bgNeutralHover).toEqual("rgb(17.924% 17.924% 17.924%)");
  });

  it("should return correct color when lightness is between 0.7 and 0.955", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.75 0.03 170)",
    ).getColors();

    expect(bgNeutralHover).toEqual("rgb(4.3484% 4.3484% 4.3484%)");
  });

  it("should return correct color when lightness > or equal to 0.955", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.96 0.03 170)",
    ).getColors();

    expect(bgNeutralHover).toEqual("rgb(4.3484% 4.3484% 4.3484%)");
  });
});

describe("bgNeutralActive color", () => {
  it("should return correct color when lightness < 0.4", () => {
    const { bgNeutralActive } = new LightModeTheme(
      "oklch(0.35 0.03 170)",
    ).getColors();

    expect(bgNeutralActive).toEqual("rgb(0% 0% 0%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.955", () => {
    const { bgNeutralActive } = new LightModeTheme(
      "oklch(0.80 0.03 170)",
    ).getColors();

    expect(bgNeutralActive).toEqual("rgb(0% 0% 0%)");
  });

  it("should return correct color when lightness > or equal to 0.955", () => {
    const { bgNeutralActive } = new LightModeTheme(
      "oklch(0.96 0.03 170)",
    ).getColors();

    expect(bgNeutralActive).toEqual("rgb(0% 0% 0%)");
  });
});

describe("bgNeutralSubtle color", () => {
  it("should return correct color when lightness >  0.93", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();

    expect(bgNeutralSubtle).toEqual("rgb(93.635% 94.291% 94.022%)");
  });

  it("should return correct color when lightness < or equal to 0.93", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.92 0.03 170)",
    ).getColors();

    expect(bgNeutralSubtle).toEqual("rgb(95.592% 96.251% 95.981%)");
  });

  it("should return correct color when seedChroma >  0.01", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.92 0.1 170)",
    ).getColors();

    expect(bgNeutralSubtle).toEqual("rgb(95.592% 96.251% 95.981%)");
  });

  it("should return correct color when chroma < 0.04", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.92 0.03 170)",
    ).getColors();

    expect(bgNeutralSubtle).toEqual("rgb(95.592% 96.251% 95.981%)");
  });
});

describe("bgNeutralSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgNeutralSubtleHover } = new LightModeTheme(
      "oklch(0.92 0.1 170)",
    ).getColors();

    expect(bgNeutralSubtleHover).toEqual("rgb(97.164% 97.825% 97.554%)");
  });
});

describe("bgNeutralSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgNeutralSubtleActive } = new LightModeTheme(
      "oklch(0.92 0.1 170)",
    ).getColors();

    expect(bgNeutralSubtleActive).toEqual("rgb(94.286% 94.944% 94.674%)");
  });
});

describe("bgPositive color", () => {
  it("should return correct color when seed color is green (hue between 116 and 165) and chroma > 0.11", () => {
    const { bgPositive } = new LightModeTheme(
      "oklch(0.62 0.19 145)",
    ).getColors();

    expect(bgPositive).toEqual("rgb(30.224% 61.63% 0%)");
  });

  it("should return correct color when seed color is green (hue between 116 and 165) but chroma is not greater than 0.11", () => {
    const { bgPositive } = new LightModeTheme(
      "oklch(0.62 0.1 145)",
    ).getColors();

    expect(bgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });

  it("should return correct color when seed color is not green (hue outside 116-165) and chroma > 0.11", () => {
    const { bgPositive } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();

    expect(bgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });

  it("should return correct color when seed color is not green (hue outside 116-165) and chroma is not greater than 0.11", () => {
    const { bgPositive } = new LightModeTheme(
      "oklch(0.62 0.1 100)",
    ).getColors();

    expect(bgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });
});

describe("bgPositiveHover color", () => {
  it("should return correct color", () => {
    const { bgPositiveHover } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();

    expect(bgPositiveHover).toEqual("rgb(18.172% 69.721% 25.266%)");
  });
});

describe("bgPositiveActive color", () => {
  it("should return correct color", () => {
    const { bgPositiveActive } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();

    expect(bgPositiveActive).toEqual("rgb(0% 60.947% 15.563%)");
  });
});

describe("bgPositiveSubtle color", () => {
  it("should return correct color", () => {
    const { bgPositiveSubtle } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();

    expect(bgPositiveSubtle).toEqual("rgb(81.329% 100% 81.391%)");
  });
});

describe("bgPositiveSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgPositiveSubtleHover } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();

    expect(bgPositiveSubtleHover).toEqual("rgb(83.899% 100% 83.95%)");
  });
});

describe("bgPositiveSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgPositiveSubtleActive } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();

    expect(bgPositiveSubtleActive).toEqual("rgb(80.049% 98.746% 80.116%)");
  });
});

describe("bgNegative color", () => {
  it("should return correct color when seed color is red (hue between 5 and 49) and chroma > 0.12", () => {
    const { bgNegative } = new LightModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();

    expect(bgNegative).toEqual("rgb(82.941% 0.97856% 21.484%)");
  });

  it("should return correct color when seed color is red (hue between 5 and 49) but chroma is not greater than 0.12", () => {
    const { bgNegative } = new LightModeTheme("oklch(0.55 0.1 27)").getColors();

    expect(bgNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });

  it("should return correct color when seed color is not red (hue outside 5-49) and chroma > 0.12", () => {
    const { bgNegative } = new LightModeTheme(
      "oklch(0.55 0.22 60)",
    ).getColors();

    expect(bgNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });

  it("should return correct color when seed color is not red (hue outside 5-49) and chroma is not greater than 0.12", () => {
    const { bgNegative } = new LightModeTheme("oklch(0.55 0.1 60)").getColors();

    expect(bgNegative).toEqual("rgb(83.108% 4.6651% 10.252%)");
  });
});

describe("bgNegativeHover color", () => {
  it("should return correct color", () => {
    const { bgNegativeHover } = new LightModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();

    expect(bgNegativeHover).toEqual("rgb(90.138% 15.796% 27.164%)");
  });
});

describe("bgNegativeActive color", () => {
  it("should return correct color", () => {
    const { bgNegativeActive } = new LightModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();

    expect(bgNegativeActive).toEqual("rgb(80.074% 0% 19.209%)");
  });
});

describe("bgNegativeSubtle color", () => {
  it("should return correct color", () => {
    const { bgNegativeSubtle } = new LightModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();

    expect(bgNegativeSubtle).toEqual("rgb(100% 88.914% 88.427%)");
  });
});

describe("bgNegativeSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgNegativeSubtleHover } = new LightModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();

    expect(bgNegativeSubtleHover).toEqual("rgb(100% 92.552% 92.132%)");
  });
});

describe("bgNegativeSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgNegativeSubtleActive } = new LightModeTheme(
      "oklch(0.55 0.22 27)",
    ).getColors();

    expect(bgNegativeSubtleActive).toEqual("rgb(100% 87.314% 86.814%)");
  });
});

describe("bgWarning color", () => {
  it("should return correct color when seed color is yellow (hue between 60 and 115) and chroma > 0.09", () => {
    const { bgWarning } = new LightModeTheme("oklch(0.75 0.15 85)").getColors();

    expect(bgWarning).toEqual("rgb(91.527% 60.669% 16.491%)");
  });

  it("should return correct color when seed color is yellow (hue between 60 and 115) but chroma is not greater than 0.09", () => {
    const { bgWarning } = new LightModeTheme("oklch(0.75 0.05 85)").getColors();

    expect(bgWarning).toEqual("rgb(85.145% 64.66% 8.0285%)");
  });

  it("should return correct color when seed color is not yellow (hue outside 60-115) and chroma > 0.09", () => {
    const { bgWarning } = new LightModeTheme("oklch(0.75 0.15 85)").getColors();

    expect(bgWarning).toEqual("rgb(91.527% 60.669% 16.491%)");
  });

  it("should return correct color when seed color is not yellow (hue outside 60-115) and chroma is not greater than 0.09", () => {
    const { bgWarning } = new LightModeTheme("oklch(0.75 0.05 85)").getColors();

    expect(bgWarning).toEqual("rgb(85.145% 64.66% 8.0285%)");
  });
});

describe("bgWarningHover color", () => {
  it("should return correct color", () => {
    const { bgWarningHover } = new LightModeTheme(
      "oklch(0.75 0.15 85)",
    ).getColors();

    expect(bgWarningHover).toEqual("rgb(95.533% 64.413% 21.716%)");
  });
});

describe("bgWarningActive color", () => {
  it("should return correct color", () => {
    const { bgWarningActive } = new LightModeTheme(
      "oklch(0.75 0.15 85)",
    ).getColors();

    expect(bgWarningActive).toEqual("rgb(90.198% 59.428% 14.545%)");
  });
});

describe("bgWarningSubtle color", () => {
  it("should return correct color", () => {
    const { bgWarningSubtle } = new LightModeTheme(
      "oklch(0.75 0.15 85)",
    ).getColors();

    expect(bgWarningSubtle).toEqual("rgb(100% 92.843% 80.874%)");
  });
});

describe("bgWarningSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgWarningSubtleHover } = new LightModeTheme(
      "oklch(0.75 0.15 85)",
    ).getColors();

    expect(bgWarningSubtleHover).toEqual("rgb(100% 95.606% 84.445%)");
  });
});

describe("bgWarningSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgWarningSubtleActive } = new LightModeTheme(
      "oklch(0.75 0.15 85)",
    ).getColors();

    expect(bgWarningSubtleActive).toEqual("rgb(100% 91.541% 79.601%)");
  });
});

describe("fg color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fg } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fg).toEqual("rgb(2.2326% 2.2326% 2.2326%)");
  });

  it("should return correct color when chroma >  0.04", () => {
    const { fg } = new LightModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fg).toEqual("rgb(2.8027% 2.0973% 1.6301%)");
  });
});

describe("fgAccent color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgAccent } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgAccent).toEqual("rgb(38.473% 32.008% 26.943%)");
  });

  it("should return correct color when chroma >  0.04", () => {
    const { fgAccent } = new LightModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgAccent).toEqual("rgb(48.857% 27.291% 4.3335%)");
  });
});

describe("fgNeutral color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgNeutral } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgNeutral).toEqual("rgb(12.685% 12.685% 12.685%)");
  });

  it("should return correct color when chroma >  0.04 and hue is between 120 and 300", () => {
    const { fgNeutral } = new LightModeTheme("oklch(0.45 0.1 150)").getColors();

    expect(fgNeutral).toEqual("rgb(11.952% 13.038% 12.117%)");
  });

  it("should return correct color when chroma >  0.04 and hue is not between 120 and 300", () => {
    const { fgNeutral } = new LightModeTheme("oklch(0.45 0.1 110)").getColors();

    expect(fgNeutral).toEqual("rgb(12.734% 12.82% 11.553%)");
  });
});

describe("fgNeutralSubtle color", () => {
  it("should return correct color", () => {
    const { fgNeutralSubtle } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(fgNeutralSubtle).toEqual("rgb(49.631% 49.631% 49.631%)");
  });
});

describe("fgPositive color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgPositive } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(fgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });

  it("should return correct color when lightness >  0.04", () => {
    const { fgPositive } = new LightModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });

  it("should return correct color hue is between 116 and 165", () => {
    const { fgPositive } = new LightModeTheme(
      "oklch(0.45 0.1 120)",
    ).getColors();

    expect(fgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });

  it("should return correct color hue is not between 116 and 165", () => {
    const { fgPositive } = new LightModeTheme("oklch(0.45 0.1 30)").getColors();

    expect(fgPositive).toEqual("rgb(6.7436% 63.436% 18.481%)");
  });
});

describe("fgNegative color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgNegative } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(fgNegative).toEqual("rgb(100% 0% 31.57%)");
  });

  it("should return correct color when chroma >  0.04", () => {
    const { fgNegative } = new LightModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgNegative).toEqual("rgb(100% 0% 31.57%)");
  });

  it("should return correct color hue is between 5 and 49", () => {
    const { fgNegative } = new LightModeTheme("oklch(0.45 0.1 30)").getColors();

    expect(fgNegative).toEqual("rgb(100% 0% 31.57%)");
  });

  it("should return correct color hue is not between 5 and 49", () => {
    const { fgNegative } = new LightModeTheme(
      "oklch(0.45 0.1 120)",
    ).getColors();

    expect(fgNegative).toEqual("rgb(100% 0% 31.57%)");
  });
});

describe("fgWarning color", () => {
  it("should return correct color", () => {
    const { fgWarning } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(fgWarning).toEqual("rgb(76.894% 49.631% 0%)");
  });
});

describe("fgOnAccent color ", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { fgOnAccent } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(fgOnAccent).toEqual("rgb(94.752% 94.752% 94.752%)");
  });

  it("should return correct color when chroma >  0.04", () => {
    const { fgOnAccent } = new LightModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(fgOnAccent).toEqual("rgb(97.954% 93.998% 90.979%)");
  });
});

describe("fgOnAssistive color ", () => {
  it("should return correct color", () => {
    const { fgOnAssistive } = new LightModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnAssistive).toEqual("rgb(96.059% 96.059% 96.059%)");
  });
});

describe("fgOnNeutral color ", () => {
  it("should return correct color", () => {
    const { fgOnNeutral } = new LightModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnNeutral).toEqual("rgb(94.752% 94.752% 94.752%)");
  });
});

describe("fgOnPositive color ", () => {
  it("should return correct color", () => {
    const { fgOnPositive } = new LightModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnPositive).toEqual("rgb(81.009% 100% 81.169%)");
  });
});

describe("fgOnNegative color ", () => {
  it("should return correct color", () => {
    const { fgOnNegative } = new LightModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnNegative).toEqual("rgb(100% 89.124% 86.925%)");
  });
});

describe("fgOnWarning color ", () => {
  it("should return correct color", () => {
    const { fgOnWarning } = new LightModeTheme(
      "oklch(0.45 0.03 110)",
    ).getColors();

    expect(fgOnWarning).toEqual("rgb(19.085% 11.601% 0%)");
  });
});

describe("bd color", () => {
  it("should return correct color", () => {
    const { bd } = new LightModeTheme("oklch(0.45 0.5 60)").getColors();

    expect(bd).toEqual("rgb(75.553% 74.037% 72.885%)");
  });
});

describe("bdAccent color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { bdAccent } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(bdAccent).toEqual("rgb(38.473% 32.008% 26.943%)");
  });

  it("should return correct color when chroma > 0.04", () => {
    const { bdAccent } = new LightModeTheme("oklch(0.45 0.1 60)").getColors();

    expect(bdAccent).toEqual("rgb(48.857% 27.291% 4.3335%)");
  });
});

describe("bdFocus color", () => {
  it("should return correct color when lightness < 0.6", () => {
    const { bdFocus } = new LightModeTheme("oklch(0.45 0.4 60)").getColors();

    expect(bdFocus).toEqual("rgb(68.381% 33.855% 0%)");
  });

  it("should return correct color when lightness > 0.8", () => {
    const { bdFocus } = new LightModeTheme("oklch(0.85 0.03 60)").getColors();

    expect(bdFocus).toEqual("rgb(68.313% 33.908% 0%)");
  });

  it("should return correct color when chroma < 0.15", () => {
    const { bdFocus } = new LightModeTheme("oklch(0.85 0.1 60)").getColors();

    expect(bdFocus).toEqual("rgb(68.313% 33.908% 0%)");
  });

  it("should return correct color when hue is between 0 and 55", () => {
    const { bdFocus } = new LightModeTheme("oklch(0.85 0.1 30)").getColors();

    expect(bdFocus).toEqual("rgb(72.468% 27.962% 22.197%)");
  });

  it("should return correct color when hue >  340", () => {
    const { bdFocus } = new LightModeTheme("oklch(0.85 0.1 350)").getColors();

    expect(bdFocus).toEqual("rgb(68.494% 27.322% 49.304%)");
  });
});

describe("bdNeutral color", () => {
  it("should return correct color when chroma < 0.04", () => {
    const { bdNeutral } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(bdNeutral).toEqual("rgb(33.384% 33.384% 33.384%)");
  });
});

describe("bdNeutralHover", () => {
  it("should return correct color", () => {
    const { bdNeutralHover } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdNeutralHover).toEqual("rgb(62.05% 62.05% 62.05%)");
  });
});

describe("bdPositive", () => {
  it("should return correct color", () => {
    const { bdPositive } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdPositive).toEqual("rgb(37.9% 86.464% 41.821%)");
  });
});

describe("bdPositiveHover", () => {
  it("should return correct color", () => {
    const { bdPositiveHover } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdPositiveHover).toEqual("rgb(51.497% 99.713% 54.439%)");
  });
});

describe("bdNegative", () => {
  it("should return correct color", () => {
    const { bdNegative } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdNegative).toEqual("rgb(100% 55.521% 50.654%)");
  });
});

describe("bdNegativeHover", () => {
  it("should return correct color", () => {
    const { bdNegativeHover } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdNegativeHover).toEqual("rgb(100% 72.272% 68.285%)");
  });
});

describe("bdWarning", () => {
  it("should return correct color", () => {
    const { bdWarning } = new LightModeTheme("oklch(0.45 0.03 60)").getColors();

    expect(bdWarning).toEqual("rgb(94.272% 73.467% 23.044%)");
  });
});

describe("bdWarningHover", () => {
  it("should return correct color", () => {
    const { bdWarningHover } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdWarningHover).toEqual("rgb(100% 86.971% 47.122%)");
  });
});

describe("bdOnAccent", () => {
  it("should return correct color", () => {
    const { bdOnAccent } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdOnAccent).toEqual("rgb(5.2437% 1.364% 0%)");
  });
});

describe("bdOnNeutral", () => {
  it("should return correct color", () => {
    const { bdOnNeutral } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdOnNeutral).toEqual("rgb(46.751% 46.751% 46.751%)");
  });
});

describe("bdOnPositive", () => {
  it("should return correct color", () => {
    const { bdOnPositive } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdOnPositive).toEqual("rgb(0% 22.253% 0%)");
  });
});

describe("bdOnNegative", () => {
  it("should return correct color", () => {
    const { bdOnNegative } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdOnNegative).toEqual("rgb(25.15% 0% 0%)");
  });
});

describe("bdOnWarning", () => {
  it("should return correct color", () => {
    const { bdOnWarning } = new LightModeTheme(
      "oklch(0.45 0.03 60)",
    ).getColors();

    expect(bdOnWarning).toEqual("rgb(40.354% 27.735% 0%)");
  });
});
