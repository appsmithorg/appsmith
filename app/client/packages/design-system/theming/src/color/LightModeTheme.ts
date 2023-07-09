import { ColorsAccessor } from "./ColorsAccessor";

import Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";
import type { ColorModeTheme } from "./types";

export class LightModeTheme implements ColorModeTheme {
  private readonly seedColor: Color;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsAchromatic: boolean;
  private readonly seedIsCold: boolean;
  private readonly seedIsGreen: boolean;
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
      isGreen,
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
    this.seedIsGreen = isGreen;
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
      bgPositive: this.bgPositive.to("sRGB").toString(),
      bgPositiveHover: this.bgPositiveHover.to("sRGB").toString(),
      bgPositiveActive: this.bgPositiveActive.to("sRGB").toString(),
      bgPositiveSubtleHover: this.bgPositiveSubtleHover.to("sRGB").toString(),
      bgPositiveSubtleActive: this.bgPositiveSubtleActive.to("sRGB").toString(),
      bgNegative: this.bgNegative.to("sRGB").toString(),
      bgNegativeHover: this.bgNegativeHover.to("sRGB").toString(),
      bgNegativeActive: this.bgNegativeActive.to("sRGB").toString(),
      bgNegativeSubtleHover: this.bgNegativeSubtleHover.to("sRGB").toString(),
      bgNegativeSubtleActive: this.bgNegativeSubtleActive.to("sRGB").toString(),
      bgWarning: this.bgWarning.to("sRGB").toString(),
      bgWarningHover: this.bgWarningHover.to("sRGB").toString(),
      bgWarningActive: this.bgWarningActive.to("sRGB").toString(),
      bgWarningSubtleHover: this.bgWarningSubtleHover.to("sRGB").toString(),
      bgWarningSubtleActive: this.bgWarningSubtleActive.to("sRGB").toString(),
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
      fgPositive: this.fgPositive.to("sRGB").toString(),
      fgOnPositive: this.fgOnPositive.toString(),
      fgNegative: this.fgNegative.to("sRGB").toString(),
      fgOnNegative: this.fgOnNegative.toString(),
      fgNeutral: this.fgNeutral.toString(),
      fgOnNeutral: this.fgOnNeutral.toString(),
      fgWarning: this.fgWarning.to("sRGB").toString(),
      fgOnWarning: this.fgOnWarning.toString(),
      fgOnAssistive: this.fgOnAssistive.toString(),
      // bd
      bdAccent: this.bdAccent.toString(),
      bdFocus: this.bdFocus.toString(),
      bdNegative: this.bdNegative.to("sRGB").toString(),
      bdNegativeHover: this.bdNegativeHover.to("sRGB").toString(),
      bdNeutral: this.bdNeutral.toString(),
      bdNeutralHover: this.bdNeutralHover.toString(),
      bdPositive: this.bdPositive.to("sRGB").toString(),
      bdPositiveHover: this.bdPositiveHover.to("sRGB").toString(),
      bdWarning: this.bdWarning.to("sRGB").toString(),
      bdWarningHover: this.bdWarning.to("sRGB").toString(),
    };
  };

  /*
   * Background colors
   */

  // Main application background color.
  // Applies to canvas. In light mode it is extremely light (and therefore desatured) tint of user-set seed color.
  // This ensures harmonious combination with main accents and neutrals.
  private get bg() {
    const color = this.seedColor.clone();

    // For very light seeds set bg darker than usually, so that accent surfaces are clearly visible against it.
    if (this.seedIsVeryLight) {
      color.oklch.l = 0.9;
    }

    if (!this.seedIsVeryLight) {
      color.oklch.l = 0.985;
    }

    // Cold colors can have a bit more chroma while staying perceptually neutral
    if (this.seedIsCold) {
      color.oklch.c = 0.009;
    }

    if (!this.seedIsCold) {
      color.oklch.c = 0.007;
    }

    // If initial seed had non-substantial amount of chroma, make sure bg is achromatic.
    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    return color;
  }

  // Main accent color. Largely is the same as user-set seed color.
  private get bgAccent() {
    const color = this.seedColor.clone();

    // If seed is very light, make bg darker than usual (see above). Make sure then, that the accent is bright enough.
    if (this.seedIsVeryLight) {
      color.oklch.l = 0.975;
    }

    return color;
  }

  // Hover state of bgAccent. Slightly lighter than the resting state to produce the effect of moving closer to the viewer / inspection.
  private get bgAccentHover() {
    const color = this.bgAccent.clone();

    // “Slightly lighter” is very dependent on the initial amount of lightness as well as how light (or dark) the surroundings are.
    if (this.seedLightness < 0.06) {
      color.oklch.l = this.bgAccent.oklch.l + 0.28;
    }

    if (this.seedLightness > 0.06 && this.seedLightness < 0.14) {
      color.oklch.l = this.bgAccent.oklch.l + 0.2;
    }

    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.21 &&
      this.seedIsCold
    ) {
      color.oklch.l = this.bgAccent.oklch.l + 0.1;
    }

    // Warm colors require a little bit more lightness in this range than colds to be sufficiently perceptually lighter.
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

    // For very light seeds it's impossible to produce hover state that is sufficiently perceptibly lighter, therefore switching to darker hovers.
    // Yellow has largest amount of chroma available at the top (by lightness) of OKLCh space, compensating by slightly decreasing chroma and decreasing lightness.
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

  // Active state of bgAccent. Slightly darker than the resting state to produce the effect of moving further from the viewer / being pushed down.
  private get bgAccentActive() {
    const color = this.bgAccent.clone();

    // “Slightly darker” is very dependent on the initial amount of lightness as well as how light (or dark) the surroundings are.
    if (this.seedLightness < 0.4) {
      color.oklch.l = this.bgAccent.oklch.l - 0.04;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l = this.bgAccent.oklch.l - 0.02;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l = this.bgAccent.oklch.l - 0.01;
    }

    // For very light seeds complement the effect with increased chroma.
    if (this.seedIsVeryLight) {
      color.oklch.l = 0.935;
      color.oklch.c = this.seedChroma * 1.15;
      color.oklch.h = this.seedHue;
    }

    return color;
  }

  // Subtle variant of bgAccent. Lighter and less saturated.
  private get bgAccentSubtle() {
    const color = this.seedColor.clone();

    if (this.seedLightness < 0.94) {
      color.oklch.l = 0.94;
    }

    // Colder seeds require a bit more chroma to not seem completely washed out
    if (this.seedChroma > 0.09 && this.seedIsCold) {
      color.oklch.c = 0.09;
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
    const color = this.bgAccentSubtle.clone();

    color.oklch.l = color.oklch.l + 0.02;

    return color;
  }

  private get bgAccentSubtleActive() {
    const color = this.bgAccentSubtle.clone();

    color.oklch.l = color.oklch.l - 0.01;

    return color;
  }

  // Positive background, green.
  private get bgPositive() {
    const color = new Color("oklch", [0.62, 0.19, 145]);

    // If the seed color is also green, adjust positive by hue to make it distinct from accent.
    if (this.seedIsGreen && this.seedColor.oklch.c > 0.11) {
      if (this.seedColor.oklch.h < 145) {
        color.oklch.h = 155;
      }
      if (this.seedColor.oklch.h >= 145) {
        color.oklch.h = 135;
      }
    }

    return color;
  }

  private get bgPositiveHover() {
    const color = this.bgPositive.clone();

    // Lightness of bgPositive is known, no additional checks like in bgAccentHover
    color.oklch.l = color.oklch.l + 0.05;

    return color;
  }

  private get bgPositiveActive() {
    const color = this.bgPositive.clone();

    // Lightness of bgPositive is known, no additional checks like in bgAccentActive
    color.oklch.l = color.oklch.l - 0.02;

    return color;
  }

  private get bgPositiveSubtle() {
    const color = this.bgPositive.clone();

    color.oklch.l = 0.94;
    color.oklch.c = 0.09;

    return color;
  }

  private get bgPositiveSubtleHover() {
    const color = this.bgPositiveSubtle.clone();

    color.oklch.l = color.oklch.l + 0.02;

    return color;
  }

  private get bgPositiveSubtleActive() {
    const color = this.bgPositiveSubtle.clone();

    color.oklch.l = color.oklch.l - 0.01;

    return color;
  }

  // Warning background, yellow
  private get bgWarning() {
    const color = new Color("oklch", [0.75, 0.15, 85]);

    // Check for clashes with seed, adjust by hue to make it distinct
    if (this.seedIsYellow && this.seedColor.oklch.c > 0.09) {
      if (this.seedColor.oklch.h < 85) {
        color.oklch.h = 95;
      }
      if (this.seedColor.oklch.h >= 85) {
        color.oklch.h = 70;
      }
    }

    return color;
  }

  private get bgWarningHover() {
    const color = this.bgWarning.clone();

    // Lightness of bgWarning is known, no additional checks like in bgAccentHover
    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgWarningActive() {
    const color = this.bgWarning.clone();

    // Lightness of bgWarning is known, no additional checks like in bgAccentActive
    color.oklch.l = color.oklch.l - 0.01;

    return color;
  }

  private get bgWarningSubtle() {
    const color = this.bgWarning.clone();

    color.oklch.l = 0.94;
    color.oklch.c = 0.06;

    return color;
  }

  private get bgWarningSubtleHover() {
    const color = this.bgWarningSubtle.clone();

    color.oklch.l = color.oklch.l + 0.02;

    return color;
  }

  private get bgWarningSubtleActive() {
    const color = this.bgWarningSubtle.clone();

    color.oklch.l = color.oklch.l - 0.01;

    return color;
  }

  // Negative background, red.
  private get bgNegative() {
    const color = new Color("oklch", [0.55, 0.22, 27]);

    // If seed is red adjust negative by hue to make it distinct
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
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bgAccentHover
    color.oklch.l = color.oklch.l + 0.05;

    return color;
  }

  private get bgNegativeActive() {
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bgAccentActive
    color.oklch.l = color.oklch.l - 0.02;

    return color;
  }

  private get bgNegativeSubtle() {
    const color = this.bgNegative.clone();

    color.oklch.l = 0.94;
    color.oklch.c = 0.06;

    return color;
  }

  private get bgNegativeSubtleHover() {
    const color = this.bgNegativeSubtle.clone();

    color.oklch.l = color.oklch.l + 0.02;

    return color;
  }

  private get bgNegativeSubtleActive() {
    const color = this.bgNegativeSubtle.clone();

    color.oklch.l = color.oklch.l - 0.01;

    return color;
  }

  private get bgNeutral() {
    return "#f2f2f2";
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
  // Main application foreground color.
  // Applies to static text and similar. In light mode it is extremely dark (and therefore desatured) shade of user-set seed color.
  // This ensures harmonious combination with main accents and neutrals.
  private get fg() {
    const color = this.seedColor.clone();

    // If seed color didn't have substantial amount of chroma make sure fg is achromatic.
    if (this.seedIsAchromatic) {
      color.oklch.l = 0.12;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.12;
    color.oklch.c = 0.032;
    return color;
  }

  // Accent foreground/content color.
  private get fgAccent() {
    const color = this.seedColor.clone();

    // For dark content on light background APCA contrast is positive. 60 is “The minimum level recommended for content text that is not body, column, or block text. In other words, text you want people to read.” Failure to reach this contrast level is most likely due to high lightness. Lightness and chroma are set to ones that reach the threshold universally irregardless of hue.
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

  // Positive foreground is produced from the initially adjusted background color (see above). Additional tweaks are applied to make sure it's distinct from fgAccent when seed is green.
  private get fgPositive() {
    const color = this.bgPositive.clone();

    if (
      this.seedIsGreen &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l > 0.5 &&
      this.fgAccent.oklch.h < 145
    ) {
      color.oklch.c = color.oklch.c + 0.05;
      color.oklch.h = color.oklch.h - 10;
    }

    return color;
  }

  // Warning foreground is produced from the initially adjusted background color (see above).
  private get fgWarning() {
    const color = this.bgWarning.clone();

    // Yellow hue interval in OKLCh is less symmetrical than green, compensation is applied to results of bgNegative
    color.oklch.l = color.oklch.l - 0.1;
    color.oklch.c = color.oklch.c + 0.1;
    color.oklch.h = color.oklch.h - 9;

    return color;
  }

  // Negative foreground is produced from the initially adjusted background color (see above). Additional tweaks are applied to make sure it's distinct from fgAccent when seed is red.
  private get fgNegative() {
    const color = this.bgNegative.clone();

    // Red hue interval bgNegativein OKLCh is less symmetrical than green, compensation is applied to results of bgNegative
    color.oklch.l = color.oklch.l + 0.1;
    color.oklch.c = color.oklch.c + 0.1;
    color.oklch.h = color.oklch.h - 10;

    if (
      this.seedIsRed &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l > 0.5 &&
      this.fgAccent.oklch.h < 27
    ) {
      color.oklch.c = color.oklch.c + 0.05;
      color.oklch.h = color.oklch.h - 10;
    }

    return color;
  }

  // Foreground for content on top of bgAccent
  private get fgOnAccent() {
    const tint = this.seedColor.clone();
    const shade = this.seedColor.clone();

    if (this.seedIsAchromatic) {
      tint.oklch.c = 0;
      shade.oklch.c = 0;
    }

    // Light and dark derivatives of the seed
    tint.oklch.l = 0.96;
    shade.oklch.l = 0.23;

    // Check which of them has better contrast with bgAccent
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
  // Accent border color
  private get bdAccent() {
    const color = this.seedColor.clone();

    // For dark content on light background APCA contrast is positive. 15 is “The absolute minimum for any non-text that needs to be discernible and differentiable, but does not apply to semantic non-text such as icons”. In practice, thin borders are perceptually too subtle when using this as a threshould. 25 is used as the required minimum instead. Failure to reach this contrast level is most likely due to high lightness. Lightness and chroma are set to ones that reach the threshold universally irregardless of hue.
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

  // Keyboard focus outline. Opposite complimentary hue to the seed.
  private get bdFocus() {
    const color = this.seedColor.clone();

    color.oklch.h = this.seedHue - 180;

    if (this.seedLightness > 0.7) {
      color.oklch.l = 0.7;
    }

    return color;
  }

  // Negative (red) border. Produced out of bgNegative. Additional compensations are applied if seed is within red range.
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

  // Neutral (gray) border. Desatured version of the seed for harmonious combination with backgrounds and accents.
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

  // Positive (green) border. Additional compensations are applied if seed is withing green range.
  private get bdPositive() {
    const color = this.bgPositive.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.11 &&
      this.bdAccent.oklch.h < 145 &&
      this.bdAccent.oklch.h >= 116
    ) {
      color.oklch.h = color.oklch.h + 5;
      color.oklch.l = color.oklch.l + 0.1;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.11 &&
      this.bdAccent.oklch.h >= 145 &&
      this.bdAccent.oklch.h < 166
    ) {
      color.oklch.h = color.oklch.h - 5;
      color.oklch.l = color.oklch.l + 0.05;
    }

    return color;
  }

  private get bdPositiveHover() {
    const color = this.bdPositive.clone();

    if (this.bdPositive.oklch.l < 0.06) {
      color.oklch.l = color.oklch.l + 0.6;
    }

    if (this.bdPositive.oklch.l >= 0.06 && this.bdPositive.oklch.l < 0.25) {
      color.oklch.l = color.oklch.l + 0.4;
    }

    if (this.bdPositive.oklch.l >= 0.25 && this.bdPositive.oklch.l < 0.5) {
      color.oklch.l = color.oklch.l + 0.25;
    }

    if (this.bdPositive.oklch.l >= 0.5) {
      color.oklch.l = color.oklch.l + 0.1;
    }

    return color;
  }

  // Warning (yellow) border. Produced out of bgNegative. Additional compensations are applied if seed is within yellow range.
  private get bdWarning() {
    const color = this.bgWarning.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.09 &&
      this.bdAccent.oklch.h < 85 &&
      this.bdAccent.oklch.h >= 60
    ) {
      color.oklch.h = color.oklch.h + 10;
      color.oklch.l = color.oklch.l + 0.1;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.09 &&
      this.bdAccent.oklch.h >= 85 &&
      this.bdAccent.oklch.h < 110
    ) {
      color.oklch.h = color.oklch.h - 10;
      color.oklch.l = color.oklch.l + 0.05;
    }

    return color;
  }

  private get bdWarningHover() {
    const color = this.bdWarning.clone();

    if (this.bdWarning.oklch.l < 0.06) {
      color.oklch.l = color.oklch.l + 0.6;
    }

    if (this.bdWarning.oklch.l >= 0.06 && this.bdWarning.oklch.l < 0.25) {
      color.oklch.l = color.oklch.l + 0.4;
    }

    if (this.bdWarning.oklch.l >= 0.25 && this.bdWarning.oklch.l < 0.5) {
      color.oklch.l = color.oklch.l + 0.25;
    }

    if (this.bdWarning.oklch.l >= 0.5) {
      color.oklch.l = color.oklch.l + 0.1;
    }

    return color;
  }
}
