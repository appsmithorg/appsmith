import Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";
import defaultsTokens from "../tokens/defaultTokens.json";

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

  lighten = (color: ColorTypes, lightness = 0.1) => {
    return this.parse(color)
      .set("oklch.l", (l) => l + lightness)
      .toString({ format: "hex" });
  };

  darken = (color: ColorTypes, lightness = 0.1) => {
    return this.parse(color)
      .set("oklch.l", (l) => l - lightness)
      .toString({ format: "hex" });
  };

  /**
   * returns black or white based on the contrast of the color compare to white
   * using APCA algorithm
   */
  getComplementaryGrayscale = () => {
    const contrast = this.color.contrast(new Color("#fff"), "APCA");

    // if contrast is less than -35 then the text color should be white
    if (contrast < -60) return "#fff";

    return "#000";
  };

  getFocus = () => {
    return defaultsTokens.focusColor;
  };
}
