import { ColorsAccessor } from "../ColorsAccessor";

import type Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";
import type { ColorModeTheme } from "./types";

export class DarkModeTheme implements ColorModeTheme {
  private readonly seedColor: Color;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsVeryDark: boolean;
  private readonly seedIsAchromatic: boolean;

  constructor(color: ColorTypes) {
    const {
      chroma,
      color: seedColor,
      hue,
      isAchromatic,
      isVeryDark,
      lightness,
    } = new ColorsAccessor(color);
    this.seedColor = seedColor;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
    this.seedHue = hue;
    this.seedIsVeryDark = isVeryDark;
    this.seedIsAchromatic = isAchromatic;
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
      fgNeutral: this.fgNeutral.toString(),
      fgPositive: this.fgPositive,
      fgWarn: this.fgWarn,
      fgNegative: this.fgNegative,
      fgOnAssistive: this.fgOnAssistive.toString(),
      // bd
      bdAccent: this.bdAccent.toString(),
      bdFocus: this.bdFocus.toString(),
      bdNeutral: this.bdNeutral.toString(),
      bdNeutralHover: this.bdNeutralHover.toString(),
      bdNegative: this.bdNegative,
      bdNegativeHover: this.bdNegativeHover,
    };
  };

  /*
   * Background colors
   */
  private get bg() {
    const color = this.seedColor.clone();

    if (this.seedIsAchromatic) {
      color.oklch.l = 0.15;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.15;
    color.oklch.c = 0.064;
    return color;
  }

  private get bgAccent() {
    const color = this.seedColor.clone();

    if (this.seedIsVeryDark) {
      color.oklch.l = 0.3;
      return color;
    }

    return color;
  }

  private get bgAccentHover() {
    return this.bgAccent.clone().lighten(0.06);
  }

  private get bgAccentActive() {
    return this.bgAccentHover.clone().darken(0.1);
  }

  // used only for generating child colors, not used as a token
  private get bgAccentSubtle() {
    const color = this.seedColor.clone();

    if (this.seedLightness > 0.3) {
      color.oklch.l = 0.3;
    }

    if (this.seedChroma > 0.112 && !this.seedIsAchromatic) {
      color.oklch.c = 0.112;
    }

    return color;
  }

  private get bgAccentSubtleHover() {
    return this.bgAccentSubtle.clone().lighten(0.06);
  }

  private get bgAccentSubtleActive() {
    return this.bgAccentSubtleHover.clone().darken(0.1);
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
      color.oklch.l = 0.965;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.965;
    color.oklch.c = 0.024;
    return color;
  }

  private get fgAccent() {
    const color = this.seedColor.clone();

    if (this.bg.contrastAPCA(this.seedColor) >= -60) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.79;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.79;
      color.oklch.c = 0.136;
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

    tint.oklch.l = 0.94;
    shade.oklch.l = 0.27;

    if (-this.bgAccent.contrastAPCA(tint) < this.bgAccent.contrastAPCA(shade)) {
      return shade;
    }

    return tint;
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

  private get bdAccent() {
    const color = this.seedColor.clone();

    if (this.bg.contrastAPCA(this.seedColor) >= -25) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.82;
        color.oklch.c = 0;
        return color;
      }

      color.oklch.l = 0.75;
      color.oklch.c = 0.15;
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

    if (this.bg.contrastAPCA(color) > -25) {
      color.oklch.l = color.oklch.l + 0.15;
    }

    return color;
  }

  private get bdNeutralHover() {
    const color = this.bdNeutral.clone();

    if (this.bdNeutral.oklch.l < 0.8) {
      color.oklch.l = color.oklch.l + 0.15;
    }

    if (this.bdNeutral.oklch.l >= 0.8 && this.bdNeutral.oklch.l < 0.9) {
      color.oklch.l = color.oklch.l + 0.1;
    }

    if (this.bdNeutral.oklch.l >= 0.9) {
      color.oklch.l = color.oklch.l - 0.25;
    }

    return color;
  }

  private get bdFocus() {
    const color = this.seedColor.clone();

    color.oklch.h = this.seedHue - 180;

    if (this.seedLightness < 0.4) {
      color.oklch.l = 0.4;
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
