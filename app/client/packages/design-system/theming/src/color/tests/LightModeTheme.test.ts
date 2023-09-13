import { LightModeTheme } from "../src/LightModeTheme";

describe("bg color", () => {
  it("should return correct color when lightness > 0.93", () => {
    const { bg: bg1 } = new LightModeTheme("oklch(0.95 0.09 231)").getColors();
    expect(bg1).toBe("rgb(84.831% 87.516% 88.974%)");
  });

  it("should return correct color when lightness < 0.93", () => {
    const { bg: bg2 } = new LightModeTheme("oklch(0.92 0.09 231)").getColors();
    expect(bg2).toBe("rgb(95.828% 98.573% 100%)");
  });

  it("should return correct color when hue > 120 && hue < 300", () => {
    const { bg: bg3 } = new LightModeTheme("oklch(0.95 0.07 231)").getColors();
    expect(bg3).toBe("rgb(84.831% 87.516% 88.974%)");
  });

  it("should return correct color when hue < 120 or hue > 300", () => {
    const { bg: bg4 } = new LightModeTheme("oklch(0.92 0.07 110)").getColors();
    expect(bg4).toBe("rgb(98.101% 98.258% 96.176%)");
  });

  it("should return correct color when chroma < 0.04", () => {
    const { bg: bg5 } = new LightModeTheme("oklch(0.92 0.02 110)").getColors();
    expect(bg5).toBe("rgb(98.026% 98.026% 98.026%)");
  });
});

describe("bgAccent color", () => {
  it("should return correct color when lightness > 0.93", () => {
    const { bgAccent: bgAccent1 } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(bgAccent1).toBe("rgb(91.762% 98.141% 100%)");
  });
});

describe("bgAccentHover color", () => {
  it("should return correct color when lightness is less than 0.06", () => {
    const { bgAccentHover: bgAccentHover1 } = new LightModeTheme(
      "oklch(0.05 0.09 231)",
    ).getColors();
    expect(bgAccentHover1).toBe("rgb(0% 23.271% 34.263%)");
  });

  it("should return correct color when lightness is between 0.06 and 0.14", () => {
    const { bgAccentHover: bgAccentHover2 } = new LightModeTheme(
      "oklch(0.08 0.09 231)",
    ).getColors();
    expect(bgAccentHover2).toBe("rgb(0% 17.836% 27.428%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21 and hue is between 120 and 300", () => {
    const { bgAccentHover: bgAccentHover3 } = new LightModeTheme(
      "oklch(0.17 0.09 231)",
    ).getColors();
    expect(bgAccentHover3).toBe("rgb(0% 16.773% 26.103%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21 and hue is not between 120 and 300", () => {
    const { bgAccentHover: bgAccentHover4 } = new LightModeTheme(
      "oklch(0.17 0.09 110)",
    ).getColors();
    expect(bgAccentHover4).toBe("rgb(19.339% 18.943% 0%)");
  });

  it("should return correct color when lightness is between 0.21 and 0.4", () => {
    const { bgAccentHover: bgAccentHover5 } = new LightModeTheme(
      "oklch(0.3 0.09 110)",
    ).getColors();
    expect(bgAccentHover5).toBe("rgb(28.395% 28.425% 0%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.7", () => {
    const { bgAccentHover: bgAccentHover6 } = new LightModeTheme(
      "oklch(0.5 0.09 110)",
    ).getColors();
    expect(bgAccentHover6).toBe("rgb(45.795% 46.287% 19.839%)");
  });

  it("should return correct color when lightness is greater than 0.7", () => {
    const { bgAccentHover: bgAccentHover7 } = new LightModeTheme(
      "oklch(0.9 0.09 110)",
    ).getColors();
    expect(bgAccentHover7).toBe("rgb(92.14% 93.271% 65.642%)");
  });

  it("should return correct color when lightness is greater than 0.93 and hue is between 60 and 115", () => {
    const { bgAccentHover: bgAccentHover8 } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();
    expect(bgAccentHover8).toBe("rgb(100% 90.701% 78.457%)");
  });

  it("should return correct color when lightness is greater than 0.93 and hue is not between 116 and 165", () => {
    const { bgAccentHover: bgAccentHover9 } = new LightModeTheme(
      "oklch(0.95 0.09 120)",
    ).getColors();
    expect(bgAccentHover9).toBe("rgb(89.886% 97.8% 66.657%)");
  });
});

describe("bgAccentActive color", () => {
  it("should return correct color when lightness is less than 0.4", () => {
    const { bgAccentActive: bgAccentActive1 } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentActive1).toBe("rgb(28.712% 15.185% 0%)");
  });

  it("should return correct color when lightness is between 0.4 and 0.7", () => {
    const { bgAccentActive: bgAccentActive2 } = new LightModeTheme(
      "oklch(0.50 0.09 70)",
    ).getColors();
    expect(bgAccentActive2).toBe("rgb(49.27% 32.745% 10.549%)");
  });

  it("should return correct color when lightness is greater than or equal to 0.7", () => {
    const { bgAccentActive: bgAccentActive3 } = new LightModeTheme(
      "oklch(0.75 0.09 70)",
    ).getColors();
    expect(bgAccentActive3).toBe("rgb(81.395% 63.124% 41.808%)");
  });

  it("should return correct color when lightness is greater than 0.93", () => {
    const { bgAccentActive: bgAccentActive4 } = new LightModeTheme(
      "oklch(0.95 0.09 70)",
    ).getColors();
    expect(bgAccentActive4).toBe("rgb(100% 88.945% 74.563%)");
  });
});

describe("bgAccentSubtle color", () => {
  it("should return correct color when seedLightness is greater than 0.93", () => {
    const { bgAccentSubtle: bgAccentSubtle1 } = new LightModeTheme(
      "oklch(0.95 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle1).toBe("rgb(85.876% 96.17% 100%)");
  });

  it("should return correct color when seedLightness is less than 0.93", () => {
    const { bgAccentSubtle: bgAccentSubtle2 } = new LightModeTheme(
      "oklch(0.92 0.09 231)",
    ).getColors();
    expect(bgAccentSubtle2).toBe("rgb(78.235% 93.705% 100%)");
  });

  it("should return correct color when seedChroma is greater than 0.09 and hue is between 116 and 165", () => {
    const { bgAccentSubtle: bgAccentSubtle3 } = new LightModeTheme(
      "oklch(0.95 0.10 120)",
    ).getColors();
    expect(bgAccentSubtle3).toBe("rgb(90.964% 97.964% 71.119%)");
  });

  it("should return correct color when seedChroma is greater than 0.06 and hue is not between 116 and 165", () => {
    const { bgAccentSubtle: bgAccentSubtle4 } = new LightModeTheme(
      "oklch(0.95 0.07 170)",
    ).getColors();
    expect(bgAccentSubtle4).toBe("rgb(75.944% 100% 91.359%)");
  });

  it("should return correct color when seedChroma is less than 0.04", () => {
    const { bgAccentSubtle: bgAccentSubtle5 } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgAccentSubtle5).toBe("rgb(94.099% 94.099% 94.099%)");
  });
});

describe("bgAccentSubtleHover color", () => {
  it("should return correct color", () => {
    const { bgAccentSubtleHover: bgAccentSubtleHover1 } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleHover1).toBe("rgb(100% 91.599% 80.256%)");
  });
});

describe("bgAccentSubtleActive color", () => {
  it("should return correct color", () => {
    const { bgAccentSubtleActive: bgAccentSubtleActive1 } = new LightModeTheme(
      "oklch(0.35 0.09 70)",
    ).getColors();
    expect(bgAccentSubtleActive1).toBe("rgb(100% 87.217% 72.911%)");
  });
});

describe("bgAssistive color", () => {
  it("should return correct color when seed is achromatic", () => {
    const { bgAssistive: bgAssistive1 } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgAssistive1).toBe("rgb(5.1758% 5.1758% 5.1759%)");
  });
});

describe("bgNeutral color", () => {
  it("should return correct color when lightness is greater than 0.85", () => {
    const { bgNeutral: bgNeutral1 } = new LightModeTheme(
      "oklch(0.95 0.03 170)",
    ).getColors();
    expect(bgNeutral1).toEqual("rgb(94.099% 94.099% 94.099%)");
  });

  it("should return correct color when lightness is between 0.25 and 0.85", () => {
    const { bgNeutral: bgNeutral2 } = new LightModeTheme(
      "oklch(0.5 0.09 231)",
    ).getColors();
    expect(bgNeutral2).toEqual("rgb(21.658% 29.368% 33.367%)");
  });

  it("should return correct color when chroma is less than 0.04", () => {
    const { bgNeutral: bgNeutral3 } = new LightModeTheme(
      "oklch(0.95 0.02 170)",
    ).getColors();
    expect(bgNeutral3).toEqual("rgb(94.099% 94.099% 94.099%)");
  });

  it("should return correct color when hue is between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral: bgNeutral4 } = new LightModeTheme(
      "oklch(0.95 0.06 240)",
    ).getColors();
    expect(bgNeutral4).toEqual("rgb(87.409% 95.47% 100%)");
  });

  it("should return correct color when hue is not between 120 and 300 and chroma is not less than 0.04", () => {
    const { bgNeutral: bgNeutral5 } = new LightModeTheme(
      "oklch(0.95 0.06 30)",
    ).getColors();
    expect(bgNeutral5).toEqual("rgb(98.083% 92.81% 91.842%)");
  });
});

describe("bgNeutralHover color", () => {
  it("should return correct color when lightness is less than 0.06", () => {
    const { bgNeutralHover: bgNeutralHover1 } = new LightModeTheme(
      "oklch(0.05 0.03 170)",
    ).getColors();
    expect(bgNeutralHover1).toEqual("rgb(16.952% 16.952% 16.952%)");
  });

  it("should return correct color when lightness is between 0.06 and 0.14", () => {
    const { bgNeutralHover: bgNeutralHover2 } = new LightModeTheme(
      "oklch(0.10 0.03 170)",
    ).getColors();
    expect(bgNeutralHover2).toEqual("rgb(12.222% 12.222% 12.222%)");
  });

  it("should return correct color when lightness is between 0.14 and 0.21", () => {
    const { bgNeutralHover: bgNeutralHover3 } = new LightModeTheme(
      "oklch(0.17 0.03 170)",
    ).getColors();
    expect(bgNeutralHover3).toEqual("rgb(12.222% 12.222% 12.222%)");
  });

  it("should return correct color when lightness is between 0.21 and 0.7", () => {
    const { bgNeutralHover: bgNeutralHover4 } = new LightModeTheme(
      "oklch(0.35 0.03 170)",
    ).getColors();
    expect(bgNeutralHover4).toEqual("rgb(17.924% 17.924% 17.924%)");
  });

  it("should return correct color when lightness is between 0.7 and 0.955", () => {
    const { bgNeutralHover: bgNeutralHover5 } = new LightModeTheme(
      "oklch(0.75 0.03 170)",
    ).getColors();
    expect(bgNeutralHover5).toEqual("rgb(62.05% 62.05% 62.05%)");
  });

  it("should return correct color when lightness is greater than or equal to 0.955", () => {
    const { bgNeutralHover: bgNeutralHover6 } = new LightModeTheme(
      "oklch(0.96 0.03 170)",
    ).getColors();
    expect(bgNeutralHover6).toEqual("rgb(92.148% 92.148% 92.148%)");
  });
});
