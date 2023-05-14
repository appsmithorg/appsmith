import { ColorsAccessor } from "../ColorsAccessor";

import type Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";
import type { ColorModeTheme } from "./types";

export class LightModeTheme implements ColorModeTheme {
  private readonly seedColor: Color;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsAchromatic: boolean;
  private readonly seedIsCold: boolean;
  private readonly seedIsVeryLight: boolean;
  private readonly seedIsYellow: boolean;

  constructor(private color: ColorTypes) {
    const {
      chroma,
      color: seedColor,
      hue,
      isAchromatic,
      isCold,
      isVeryLight,
      isYellow,
      lightness,
    } = new ColorsAccessor(color);
    this.seedColor = seedColor;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
    this.seedHue = hue;
    this.seedIsAchromatic = isAchromatic;
    this.seedIsCold = isCold;
    this.seedIsVeryLight = isVeryLight;
    this.seedIsYellow = isYellow;
  }

  public getColors = () => {
    return {
      bg: this.bg.toString({ format: "hex" }),
      bgAccent: this.bgAccent.toString({ format: "hex" }),
      bgAccentHover: this.bgAccentHover.toString({ format: "hex" }),
      bgAccentActive: this.bgAccentActive.toString({ format: "hex" }),
      bgAccentSubtleHover: this.bgAccentSubtleHover.toString({ format: "hex" }),
      bgAccentSubtleActive: this.bgAccentSubtleActive.toString({
        format: "hex",
      }),
      fg: this.fg.toString({ format: "hex" }),
      fgAccent: this.fgAccent.toString({ format: "hex" }),
      fgOnAccent: this.fgOnAccent.toString({ format: "hex" }),
      fgNegative: this.fgNegative,
      bdAccent: this.bdAccent.toString({ format: "hex" }),
      bdNeutral: this.bdNeutral.toString({ format: "hex" }),
      bdNeutralHover: this.bdNeutralHover.toString({ format: "hex" }),
      bdFocus: this.bdFocus.toString({ format: "hex" }),
      bdNegative: this.bdNegative,
      bdNegativeHover: this.bdNegativeHover,
    };
  };

  /*
   * Background colors
   */
  private get bg() {
    const color = this.seedColor.clone();

    if (this.seedIsVeryLight) {
      color.oklch.l = 0.9;
    }

    if (!this.seedIsVeryLight) {
      color.oklch.l = 0.985;
    }

    if (this.seedIsCold) {
      color.oklch.c = 0.009;
    }

    if (!this.seedIsCold) {
      color.oklch.c = 0.007;
    }

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    return color;
  }

  private get bgAccent() {
    const color = this.seedColor.clone();

    if (this.seedIsVeryLight) {
      color.oklch.l = 0.975;
    }

    return color;
  }

  private get bgAccentHover() {
    const color = this.bgAccent.clone();

    if (this.seedLightness < 0.06) {
      color.oklch.l = this.seedLightness + 0.28;
    }

    if (this.seedLightness > 0.06 && this.seedLightness < 0.14) {
      color.oklch.l = this.seedLightness + 0.2;
    }

    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.25 &&
      this.seedIsCold
    ) {
      color.oklch.l = this.seedLightness + 0.1;
    }

    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.21 &&
      !this.seedIsCold
    ) {
      color.oklch.l = this.seedLightness + 0.13;
    }

    if (this.seedLightness >= 0.21 && this.seedLightness < 0.4) {
      color.oklch.l = this.seedLightness + 0.09;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l = this.seedLightness + 0.05;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l = this.seedLightness + 0.03;
    }

    if (this.seedIsVeryLight && this.seedIsYellow) {
      color.oklch.l = 0.945;
      color.oklch.c = this.seedChroma * 0.93;
      color.oklch.h = this.seedHue;
    }

    if (this.seedIsVeryLight && !this.seedIsYellow) {
      color.oklch.l = 0.95;
      color.oklch.c = this.seedChroma * 1.15;
      color.oklch.h = this.seedHue;
    }

    return color;
  }

  private get bgAccentActive() {
    const color = this.bgAccent.clone();

    if (this.seedLightness < 0.4) {
      color.oklch.l = this.seedLightness - 0.04;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l = this.seedLightness - 0.02;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l = this.seedLightness - 0.01;
    }

    if (this.seedIsVeryLight) {
      color.oklch.l = 0.935;
      color.oklch.c = this.seedChroma * 1.15;
      color.oklch.h = this.seedHue;
    }

    return color;
  }

  // used only for generating child colors, not used as a token
  private get bgAccentSubtle() {
    const color = this.seedColor.clone();

    if (this.seedLightness < 0.94) {
      color.oklch.l = 0.94;
    }

    if (this.seedChroma > 0.1 && this.seedIsCold) {
      color.oklch.c = 0.1;
    }

    if (this.seedChroma > 0.06 && !this.seedIsCold) {
      color.oklch.c = 0.06;
    }

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    return color;
  }

  private get bgAccentSubtleHover() {
    return this.bgAccentSubtle.lighten(0.02);
  }

  private get bgAccentSubtleActive() {
    return this.bgAccentSubtle.darken(0.01);
  }

  /*
   * Foreground colors
   */
  private get fg() {
    const color = this.seedColor.clone();

    if (this.seedIsAchromatic) {
      color.oklch.l = 0.12;
      color.oklch.c = 0;
    }

    color.oklch.l = 0.12;
    color.oklch.c = 0.032;

    return color;
  }

  private get fgAccent() {
    const color = this.seedColor.clone();

    if (this.seedColor.contrastAPCA(this.bg) >= -60) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.25;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.25;
      color.oklch.c = 0.064;
      return color;
    }

    return color;
  }

  private get fgOnAccent() {
    const color = this.seedColor.clone();

    if (this.seedColor.contrastAPCA(this.bg) <= -60) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.985;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.985;
      color.oklch.c = 0.016;
      return color;
    }

    if (this.seedIsAchromatic) {
      color.oklch.l = 0.15;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.15;
    color.oklch.c = 0.064;
    return color;
  }

  private get fgNegative() {
    return "#d91921";
  }

  /*
   * Border colors
   */
  private get bdAccent() {
    const color = this.seedColor.clone();

    if (this.seedColor.contrastAPCA(this.bg) >= -25) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.15;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.15;
      color.oklch.c = 0.064;
      return color;
    }

    return color;
  }

  private get bdNeutral() {
    const color = this.bdAccent.clone();

    color.oklch.c = 0.035;

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    if (this.bg.contrastAPCA(color) < 25) {
      color.oklch.l = color.oklch.l - 0.2;
    }

    return color;
  }

  private get bdNeutralHover() {
    const color = this.bdNeutral.clone();

    if (this.bdNeutral.oklch.l < 0.06) {
      color.oklch.l = color.oklch.l + 0.6;
    }

    if (this.bdNeutral.oklch.l >= 0.06 && this.bdNeutral.oklch.l < 0.25) {
      color.oklch.l = color.oklch.l + 0.4;
    }

    if (this.bdNeutral.oklch.l >= 0.25 && this.bdNeutral.oklch.l < 0.5) {
      color.oklch.l = color.oklch.l + 0.25;
    }

    if (this.bdNeutral.oklch.l >= 0.5) {
      color.oklch.l = color.oklch.l + 0.1;
    }

    return color;
  }

  private get bdFocus() {
    const color = this.seedColor.clone();

    color.oklch.h = this.seedHue - 180;

    if (this.seedLightness > 0.7) {
      color.oklch.l = 0.7;
    }

    return color;
  }

  private get bdNegative() {
    return "#d91921";
  }

  private get bdNegativeHover() {
    return "#b90707";
  }
}
