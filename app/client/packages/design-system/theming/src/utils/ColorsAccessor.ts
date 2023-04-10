import Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";
import defaultsTokens from "../tokens/defaultTokens.json";

// Ratio to replace chroma values from Figma(0-50) to colorjs(0-0.4)
const CHROMA_RATIO = 0.008;
// Ratio to replace lightness values from Figma(0-100) to colorjs(0-1)
const LIGHTNESS_RATIO = 0.01;

export class ColorsAccessor {
  private color: Color;

  constructor(color: ColorTypes) {
    this.color = this.parse(color);
  }

  private parse = (color: ColorTypes) => {
    try {
      return new Color(color);
    } catch (error) {
      return new Color(defaultsTokens.seedColor);
    }
  };

  updateColor = (color: ColorTypes) => {
    this.color = this.parse(color);

    return this;
  };

  getHex = () => {
    return this.color.toString({ format: "hex" });
  };

  /* Lightness */
  isVeryDark = () => {
    return this.color.oklch.l < 30;
  };

  isVeryLight = () => {
    return this.color.oklch.l > 90;
  };

  /* Chroma */
  isAchromatic = () => {
    return this.color.oklch.c < 5;
  };

  isColorful = () => {
    return this.color.oklch.c > 17;
  };

  /* Hue */
  isCold = () => {
    return this.color.oklch.h >= 120 && this.color.oklch.h <= 300;
  };

  isBlue = () => {
    return this.color.oklch.h >= 230 && this.color.oklch.h <= 270;
  };

  isGreen = () => {
    return this.color.oklch.h >= 105 && this.color.oklch.h <= 165;
  };

  isYellow = () => {
    return this.color.oklch.h >= 60 && this.color.oklch.h <= 75;
  };

  isRed = () => {
    return this.color.oklch.h >= 29 && this.color.oklch.h <= 50;
  };

  lighten = (color: ColorTypes, lightness: number) => {
    return this.parse(color)
      .set("oklch.l", (l) => l * lightness)
      .toString({ format: "hex" });
  };

  getLightness = () => {
    return this.color.oklch.l;
  };

  getChroma = () => {
    return this.color.oklch.c;
  };

  getHue = () => {
    return this.color.oklch.h;
  };

  getContrast = (color1: ColorTypes, color2: ColorTypes) => {
    return Color.contrast(color1, color2, "APCA");
  };

  setColor = (
    color: ColorTypes,
    lch: {
      l?: number;
      c?: number;
      h?: number;
    },
  ) => {
    const { c, h, l } = lch;
    let currentColor = this.parse(color);

    if (l) {
      currentColor = this.setLightness(currentColor, l);
    }

    if (c) {
      currentColor = this.setChroma(currentColor, c);
    }

    if (h) {
      currentColor = this.setHue(currentColor, h);
    }

    return currentColor.toString({ format: "hex" });
  };

  private setLightness = (color: Color, lightness: number) => {
    return color.set("oklch.l", lightness * LIGHTNESS_RATIO);
  };

  private setChroma = (color: Color, chroma: number) => {
    return color.set("oklch.c", chroma * CHROMA_RATIO);
  };

  private setHue = (color: Color, hue: number) => {
    return color.set("oklch.h", hue);
  };
}
