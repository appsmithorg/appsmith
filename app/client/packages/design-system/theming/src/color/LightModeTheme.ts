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
  private readonly seedIsRed: boolean;
  private readonly seedIsVeryLight: boolean;
  private readonly seedIsYellow: boolean;

  constructor(color: ColorTypes) {
    const {
      chroma,
      color: seedColor,
      hue,
      isAchromatic,
      isCold,
      isRed,
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
    this.seedIsRed = isRed;
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
      bgPositive: this.bgPositive.toString(),
      bgPositiveHover: this.bgPositiveHover.toString(),
      bgPositiveActive: this.bgPositiveActive.toString(),
      bgPositiveSubtleHover: this.bgPositiveSubtleHover.toString(),
      bgPositiveSubtleActive: this.bgPositiveSubtleActive.toString(),
      bgNegative: this.bgNegative.toString(),
      bgNegativeHover: this.bgNegativeHover.toString(),
      bgNegativeActive: this.bgNegativeActive.toString(),
      bgNegativeSubtleHover: this.bgNegativeSubtleHover.toString(),
      bgNegativeSubtleActive: this.bgNegativeSubtleActive.toString(),
      bgWarning: this.bgWarning.toString(),
      bgWarningHover: this.bgWarningHover.toString(),
      bgWarningActive: this.bgWarningActive.toString(),
      bgWarningSubtleHover: this.bgWarningSubtleHover.toString(),
      bgWarningSubtleActive: this.bgWarningSubtleActive.toString(),
      bgNeutral: this.bgNeutral.toString(),
      bgNeutralHover: this.bgNeutralHover.toString(),
      bgNeutralActive: this.bgNeutralActive.toString(),
      bgNeutralSubtle: this.bgNeutralSubtle.toString(),
      bgNeutralSubtleHover: this.bgNeutralSubtleHover.toString(),
      bgNeutralSubtleActive: this.bgNeutralSubtleActive.toString(),
      // fg
      fg: this.fg.toString(),
      fgAccent: this.fgAccent.toString(),
      fgOnAccent: this.fgOnAccent.toString(),
      fgPositive: this.fgPositive.toString(),
      fgOnPositive: this.fgOnPositive.toString(),
      fgNegative: this.fgNegative.toString(),
      fgOnNegative: this.fgOnNegative.toString(),
      fgNeutral: this.fgNeutral.toString(),
      fgOnNeutral: this.fgOnNeutral.toString(),
      fgWarning: this.fgWarning.toString(),
      fgOnWarning: this.fgOnWarning.toString(),
      fgOnAssistive: this.fgOnAssistive.toString(),
      // bd
      bdAccent: this.bdAccent.toString(),
      bdFocus: this.bdFocus.toString(),
      bdNegative: this.bdNegative.toString(),
      bdNegativeHover: this.bdNegativeHover.toString(),
      bdNeutral: this.bdNeutral.toString(),
      bdNeutralHover: this.bdNeutralHover.toString(),
      bdPositive: this.bdPositive.toString(),
      bdWarning: this.bdWarning.toString(),
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

  private get bgPositive() {
    return "#4ade80";
  }

  private get bgPositiveHover() {
    return "#3ec16c";
  }

  private get bgPositiveActive() {
    return "#35a15c";
  }

  private get bgPositiveSubtle() {
    return "#f0fff5";
  }

  private get bgPositiveSubtleHover() {
    return "#e0ffeb";
  }

  private get bgPositiveSubtleActive() {
    return "#d1ffe1";
  }

  private get bgWarning() {
    return "#ffbc4b";
  }

  private get bgWarningHover() {
    return "#f2a635";
  }

  private get bgWarningActive() {
    return "#e6952e";
  }

  private get bgWarningSubtle() {
    return "#fffaf0";
  }

  private get bgWarningSubtleHover() {
    return "#fff5e0";
  }

  private get bgWarningSubtleActive() {
    return "#fff1d1";
  }

  private get bgNegative() {
    const color = this.seedColor.clone();

    color.oklch.l = 0.55;
    color.oklch.c = 0.22;
    color.oklch.h = 27;

    if (this.seedIsRed && this.seedColor.oklch.c > 0.12) {
      if (this.seedColor.oklch.h < 27) {
        color.oklch.h = 34;
      }
      if (this.seedColor.oklch.h >= 27) {
        color.oklch.h = 20;
      }
    }

    return color;
  }

  private get bgNegativeHover() {
    return "#f24646";
  }

  private get bgNegativeActive() {
    return "#e23b3b";
  }

  private get bgNegativeSubtle() {
    return "#fff0f0";
  }

  private get bgNegativeSubtleHover() {
    return "#ffe0e0";
  }

  private get bgNegativeSubtleActive() {
    return "#ffd1d1";
  }

  private get bgNeutral() {
    return "##f2f2f2";
  }

  private get bgNeutralHover() {
    return "#ebeff5";
  }

  private get bgNeutralActive() {
    return "#e3e9f0";
  }

  private get bgNeutralSubtle() {
    return "#ffffff";
  }

  private get bgNeutralSubtleHover() {
    return "#f2f4f8";
  }

  private get bgNeutralSubtleActive() {
    return "#ebeff5";
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

  private get fgNeutral() {
    return this.bdNeutral.clone();
  }

  private get fgPositive() {
    return "#4ade80";
  }

  private get fgWarning() {
    return "#facc15";
  }

  private get fgNegative() {
    const color = this.bgNegative.clone();

    color.oklch.l = color.oklch.l + 0.1;
    color.oklch.c = color.oklch.c + 0.1;
    color.oklch.h = color.oklch.h - 10;

    if (
      this.seedIsRed &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l > 0.5 &&
      this.fgAccent.oklch.h < 28
    ) {
      color.oklch.c = color.oklch.c + 0.05;
      color.oklch.h = color.oklch.h - 15;
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

  private get fgOnNeutral() {
    return "#1c1e21";
  }

  private get fgOnPositive() {
    return "#fff";
  }

  private get fgOnWarning() {
    return "#fff";
  }

  private get fgOnNegative() {
    return "#fff";
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

  private get bdFocus() {
    const color = this.seedColor.clone();

    color.oklch.h = this.seedHue - 180;

    if (this.seedLightness > 0.7) {
      color.oklch.l = 0.7;
    }

    return color;
  }

  private get bdNegative() {
    const color = this.bgNegative.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.15 &&
      this.bdAccent.oklch.h < 27 &&
      this.bdAccent.oklch.h >= 5
    ) {
      color.oklch.h = color.oklch.h + 5;
      color.oklch.l = color.oklch.l + 0.1;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.15 &&
      this.bdAccent.oklch.h >= 27 &&
      this.bdAccent.oklch.h < 50
    ) {
      color.oklch.h = color.oklch.h - 5;
      color.oklch.l = color.oklch.l + 0.05;
    }

    return color;
  }

  private get bdNegativeHover() {
    const color = this.bdNegative.clone();

    if (this.bdNegative.oklch.l < 0.06) {
      color.oklch.l = color.oklch.l + 0.6;
    }

    if (this.bdNegative.oklch.l >= 0.06 && this.bdNegative.oklch.l < 0.25) {
      color.oklch.l = color.oklch.l + 0.4;
    }

    if (this.bdNegative.oklch.l >= 0.25 && this.bdNegative.oklch.l < 0.5) {
      color.oklch.l = color.oklch.l + 0.25;
    }

    if (this.bdNegative.oklch.l >= 0.5) {
      color.oklch.l = color.oklch.l + 0.1;
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

  private bdPositive() {
    return "#4ade80";
  }

  private get bdWarning() {
    return "#facc15";
  }
}
