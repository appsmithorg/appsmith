import { ColorsAccessor } from "./ColorsAccessor";

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

  constructor(color: ColorTypes) {
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
      // bg
      bg: this.bg.toString(),
      bgAccent: this.bgAccent.toString(),
      bgAccentHover: this.bgAccentHover.toString(),
      bgAccentActive: this.bgAccentActive.toString(),
      bgAccentSubtleHover: this.bgAccentSubtleHover.toString(),
      bgAccentSubtleActive: this.bgAccentSubtleActive.toString(),
      bgAssistive: this.bgAssistive.toString(),
      // fg
      fg: this.fg.toString(),
      fgAccent: this.fgAccent.toString(),
      fgOnAccent: this.fgOnAccent.toString(),
      fgOnAssistive: this.fgOnAssistive.toString(),
      fgNeutral: this.fgNeutral.toString(),
      fgPositive: this.fgPositive,
      fgWarn: this.fgWarn,
      fgNegative: this.fgNegative,
      // bd
      bdAccent: this.bdAccent.toString(),
      bdNeutral: this.bdNeutral.toString(),
      bdNeutralHover: this.bdNeutralHover.toString(),
      bdFocus: this.bdFocus.toString(),
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
      color.oklch.l = this.bgAccent.oklch.l + 0.28;
    }

    if (this.seedLightness > 0.06 && this.seedLightness < 0.14) {
      color.oklch.l = this.bgAccent.oklch.l + 0.2;
    }

    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.25 &&
      this.seedIsCold
    ) {
      color.oklch.l = this.bgAccent.oklch.l + 0.1;
    }

    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.21 &&
      !this.seedIsCold
    ) {
      color.oklch.l = this.bgAccent.oklch.l + 0.13;
    }

    if (this.seedLightness >= 0.21 && this.seedLightness < 0.4) {
      color.oklch.l = this.bgAccent.oklch.l + 0.09;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l = this.bgAccent.oklch.l + 0.05;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l = this.bgAccent.oklch.l + 0.03;
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
      color.oklch.l = this.bgAccent.oklch.l - 0.04;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l = this.bgAccent.oklch.l - 0.02;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l = this.bgAccent.oklch.l - 0.01;
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
    return this.bgAccentSubtle.clone().lighten(0.02);
  }

  private get bgAccentSubtleActive() {
    return this.bgAccentSubtle.clone().darken(0.01);
  }

  private get bgAssistive() {
    return this.fg.clone();
  }

  /*
   * Foreground colors
   */
  private get fg() {
    const color = this.seedColor.clone();

    if (this.seedIsAchromatic) {
      color.oklch.l = 0.12;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.12;
    color.oklch.c = 0.032;
    return color;
  }

  private get fgAccent() {
    const color = this.seedColor.clone();

    if (this.bg.contrastAPCA(this.seedColor) <= 60) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.45;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.45;
      color.oklch.c = 0.164;
      return color;
    }

    return color;
  }

  private get fgOnAccent() {
    const tint = this.seedColor.clone();
    const shade = this.seedColor.clone();

    if (this.seedIsAchromatic) {
      tint.oklch.c = 0;
      shade.oklch.c = 0;
    }

    tint.oklch.l = 0.96;
    shade.oklch.l = 0.23;

    if (
      -this.bgAccent.contrastAPCA(tint) >= this.bgAccent.contrastAPCA(shade)
    ) {
      return tint;
    }

    return shade;
  }

  private get fgNeutral() {
    return this.bdNeutral.clone();
  }

  private get fgPositive() {
    return "#4ade80";
  }

  private get fgWarn() {
    return "#facc15";
  }

  private get fgNegative() {
    return "#d91921";
  }

  private get fgOnAssistive() {
    return this.bg.clone();
  }

  /*
   * Border colors
   */
  private get bdAccent() {
    const color = this.seedColor.clone();

    if (this.bg.contrastAPCA(this.seedColor) <= 25) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.3;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.55;
      color.oklch.c = 0.25;
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
