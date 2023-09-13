import { LightModeTheme } from "../src/LightModeTheme";

describe("bg color", () => {
  it("should return correct color when lightness > 0.93", () => {
    const { bg } = new LightModeTheme("oklch(0.95 0.09 231)").getColors();
    expect(bg).toBe("rgb(84.831% 87.516% 88.974%)");
  });

  it("should return correct color when lightness < 0.93", () => {
    const { bg } = new LightModeTheme("oklch(0.92 0.09 231)").getColors();
    expect(bg).toBe("rgb(95.828% 98.573% 100%)");
  });

  it("should return correct color when hue > 120 && hue < 300", () => {
    const { bg } = new LightModeTheme("oklch(0.95 0.07 231)").getColors();
    expect(bg).toBe("rgb(84.831% 87.516% 88.974%)");
  });

  it("should return correct color when hue < 120 or hue > 300", () => {
    const { bg } = new LightModeTheme("oklch(0.92 0.07 110)").getColors();
    expect(bg).toBe("rgb(98.101% 98.258% 96.176%)");
  });

  it("should return correct color when chroma < 0.04", () => {
    const { bg } = new LightModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg).toBe("rgb(98.026% 98.026% 98.026%)");
  });
});

describe("bgAccent color", () => {
  it("should return correct color when lightness > 0.93", () => {
    const { bgAccent } = new LightModeTheme("oklch(0.95 0.09 231)").getColors();
    expect(bgAccent).toBe("rgb(91.762% 98.141% 100%)");
  });
});

describe("bgAccentHover color", () => {
  it("should return correct color when lightness is less than 0.06", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.05 0.09 231)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(0% 23.271% 34.263%)");
  });

  it("should return correct color when lightness is between 0.06 and 0.14", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.08 0.09 231)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(0% 17.836% 27.428%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21 and hue is between 120 and 300", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.17 0.09 231)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(0% 16.773% 26.103%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21 and hue is not between 120 and 300", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.17 0.09 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(19.339% 18.943% 0%)");
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

  it("should return correct color when lightness is greater than 0.7", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.9 0.09 110)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(92.14% 93.271% 65.642%)");
  });

  it("should return correct color when lightness is greater than 0.93 and hue is between 60 and 115", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(100% 90.701% 78.457%)");
  });

  it("should return correct color when lightness is greater than 0.93 and hue is not between 116 and 165", () => {
    const { bgAccentHover } = new LightModeTheme(
      "oklch(0.95 0.09 120)",
    ).getColors();
    expect(bgAccentHover).toBe("rgb(89.886% 97.8% 66.657%)");
  });
});

describe("bgAccentActive color", () => {
  it("should return correct color when lightness is less than 0.4", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(28.712% 15.185% 0%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.7", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.50 0.09 70)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(49.27% 32.745% 10.549%)");
  });

  it("should return correct color when lightness is greater than or equal to 0.7", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.75 0.09 70)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(81.395% 63.124% 41.808%)");
  });

  it("should return correct color when lightness is greater than 0.93", () => {
    const { bgAccentActive } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();
    expect(bgAccentActive).toBe("rgb(100% 88.945% 74.563%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness is greater than 0.93", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(85.876% 96.17% 100%)");
  });

  it("should return correct color when seedLightness is less than 0.93", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.92 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(78.235% 93.705% 100%)");
  });

  it("should return correct color when seedChroma is greater than 0.09 and hue is between 116 and 165", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.10 120)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(90.964% 97.964% 71.119%)");
  });

  it("should return correct color when seedChroma is greater than 0.06 and hue is not between 116 and 165", () => {
    const { bgAccentSubtle } = new LightModeTheme(
      "oklch(0.95 0.07 170)",
    ).getColors();
    expect(bgAccentSubtle).toBe("rgb(75.944% 100% 91.359%)");
  });

  it("should return correct color when seedChroma is less than 0.04", () => {
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
    expect(bgAccentSubtleHover).toBe("rgb(100% 91.599% 80.256%)");
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
    expect(bgAssistive).toBe("rgb(5.1758% 5.1758% 5.1759%)");
  });
});

describe("bgNeutral color", () => {
  it("should return correct color when lightness is greater than 0.85", () => {
    const { bgNeutral } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgNeutral).toEqual("rgb(94.099% 94.099% 94.099%)");
  });

  it("should return correct color when lightness is between 0.25 and 0.85", () => {
    const { bgNeutral } = new LightModeTheme("oklch(0.5 0.09 231)").getColors();
    expect(bgNeutral).toEqual("rgb(21.658% 29.368% 33.367%)");
  });

  it("should return correct color when chroma is less than 0.04", () => {
    const { bgNeutral } = new LightModeTheme(
      "oklch(0.95 0.02 170)",
    ).getColors();
    expect(bgNeutral).toEqual("rgb(94.099% 94.099% 94.099%)");
  });

  it("should return correct color when hue is between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral } = new LightModeTheme(
      "oklch(0.95 0.06 240)",
    ).getColors();
    expect(bgNeutral).toEqual("rgb(87.409% 95.47% 100%)");
  });

  it("should return correct color when hue is not between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral } = new LightModeTheme("oklch(0.95 0.06 30)").getColors();
    expect(bgNeutral).toEqual("rgb(98.083% 92.81% 91.842%)");
  });
});

describe("bgNeutralHover color", () => {
  it("should return correct color when lightness is less than 0.06", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.05 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(16.952% 16.952% 16.952%)");
  });

  it("should return correct color when lightness is between 0.06 and 0.14", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.10 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(12.222% 12.222% 12.222%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.17 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(12.222% 12.222% 12.222%)");
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
    expect(bgNeutralHover).toEqual("rgb(62.05% 62.05% 62.05%)");
  });

  it("should return correct color when lightness is greater than or equal to 0.955", () => {
    const { bgNeutralHover } = new LightModeTheme(
      "oklch(0.96 0.03 170)",
    ).getColors();
    expect(bgNeutralHover).toEqual("rgb(92.148% 92.148% 92.148%)");
  });
});

describe("bgNeutralActive color", () => {
  it("should return correct color when lightness is less than 0.4", () => {
    const { bgNeutralActive } = new LightModeTheme(
      "oklch(0.35 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(10.396% 10.396% 10.396%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.955", () => {
    const { bgNeutralActive } = new LightModeTheme(
      "oklch(0.80 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(60.846% 60.846% 60.846%)");
  });

  it("should return correct color when lightness is greater than or equal to 0.955", () => {
    const { bgNeutralActive } = new LightModeTheme(
      "oklch(0.96 0.03 170)",
    ).getColors();
    expect(bgNeutralActive).toEqual("rgb(90.204% 90.204% 90.204%)");
  });
});

describe("bgNeutralSubtle color", () => {
  it("should return correct color when lightness is greater than 0.93", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(94.099% 94.099% 94.099%)");
  });

  it("should return correct color when lightness is less than or equal to 0.93", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.92 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(90.851% 90.851% 90.851%)");
  });

  it("should return correct color when seedChroma is greater than 0.01", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.92 0.1 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(88.517% 91.796% 90.467%)");
  });

  it("should return correct color when chroma is less than 0.04", () => {
    const { bgNeutralSubtle } = new LightModeTheme(
      "oklch(0.92 0.03 170)",
    ).getColors();
    expect(bgNeutralSubtle).toEqual("rgb(90.851% 90.851% 90.851%)");
  });
});

describe("bgNeutralSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgNeutralSubtleHover } = new LightModeTheme(
      "oklch(0.92 0.1 170)",
    ).getColors();

    expect(bgNeutralSubtleHover).toEqual("rgb(91.102% 94.398% 93.061%)");
  });
});

describe("bgNeutralSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgNeutralSubtleActive } = new LightModeTheme(
      "oklch(0.92 0.1 170)",
    ).getColors();

    expect(bgNeutralSubtleActive).toEqual("rgb(87.229% 90.5% 89.174%)");
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
    expect(bgPositive).toEqual("rgb(6.7435% 63.436% 18.481%)");
  });

  it("should return correct color when seed color is not green (hue outside 116-165) and chroma > 0.11", () => {
    const { bgPositive } = new LightModeTheme(
      "oklch(0.62 0.19 100)",
    ).getColors();
    expect(bgPositive).toEqual("rgb(6.7435% 63.436% 18.481%)");
  });

  it("should return correct color when seed color is not green (hue outside 116-165) and chroma is not greater than 0.11", () => {
    const { bgPositive } = new LightModeTheme(
      "oklch(0.62 0.1 100)",
    ).getColors();
    expect(bgPositive).toEqual("rgb(6.7435% 63.436% 18.481%)");
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
    expect(bgPositiveSubtleHover).toEqual("rgb(84.848% 100% 84.841%)");
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
