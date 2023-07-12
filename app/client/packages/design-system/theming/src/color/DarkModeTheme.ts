import { ColorsAccessor } from "./ColorsAccessor";

import Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";
import type { ColorModeTheme } from "./types";

export class DarkModeTheme implements ColorModeTheme {
  private readonly seedColor: Color;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsAchromatic: boolean;
  private readonly seedIsCold: boolean;
  private readonly seedIsGreen: boolean;
  private readonly seedIsRed: boolean;
  private readonly seedIsVeryDark: boolean;
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
      isVeryDark,
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
    this.seedIsVeryDark = isVeryDark;
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
  // Applies to canvas. In dark mode it is extremely dark (and therefore desatured) shade of user-set seed color.
  // This ensures harmonious combination with main accents and neutrals.
  private get bg() {
    const color = this.seedColor.clone();

    // If initial seed had non-substantial amount of chroma, make sure bg is achromatic.
    if (this.seedIsAchromatic) {
      color.oklch.l = 0.15;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.15;
    color.oklch.c = 0.064;
    return color;
  }

  // Main accent color. Largely is the same as user-set seed color.
  private get bgAccent() {
    const color = this.seedColor.clone();

    // If the seed is very dark, set it to minimal lightness to make sure it's visible against bg.
    if (this.seedIsVeryDark) {
      color.oklch.l = 0.3;
      return color;
    }

    return color;
  }

  // Hover state. Slightly lighter than the resting state to produce the effect of moving closer to the viewer / inspection.
  private get bgAccentHover() {
    const color = this.bgAccent.clone();

    // “Slightly lighter” is very dependent on the initial amount of lightness as well as how light (or dark) the surroundings are.
    if (this.seedLightness < 0.3) {
      color.oklch.l = this.bgAccent.oklch.l + 0.05;
    }

    if (this.seedLightness >= 0.3 && this.seedLightness < 0.45) {
      color.oklch.l = this.bgAccent.oklch.l + 0.04;
    }

    if (this.seedLightness >= 0.45 && this.seedLightness < 0.77) {
      color.oklch.l = this.bgAccent.oklch.l + 0.03;
    }

    // In this top range lightness increase is supplemented by chroma increase to make the hover effect more perceptibe.
    if (
      this.seedLightness >= 0.77 &&
      this.seedLightness < 0.85 &&
      !this.seedIsAchromatic &&
      this.seedIsCold
    ) {
      color.oklch.l = this.bgAccent.oklch.l + 0.04;
      color.oklch.c = this.bgAccent.oklch.c + 0.05;
    }

    // Warm colors require a little bit more lightness in this range than colds to be sufficiently perceptually lighter.
    if (
      this.seedLightness >= 0.77 &&
      this.seedLightness < 0.85 &&
      !this.seedIsAchromatic &&
      !this.seedIsCold
    ) {
      color.oklch.l = this.bgAccent.oklch.l + 0.06;
      color.oklch.c = this.bgAccent.oklch.c + 0.1;
    }

    if (
      this.seedLightness >= 0.77 &&
      this.seedLightness < 0.85 &&
      this.seedIsAchromatic
    ) {
      color.oklch.l = this.bgAccent.oklch.l + 0.04;
    }

    // For very light seeds it's impossible to produce hover state that is sufficiently perceptibly lighter, switching to darker hovers.
    if (this.seedLightness >= 0.85) {
      color.oklch.l = this.bgAccent.oklch.l - 0.07;
    }

    return color;
  }

  // “Pressed” state. Slightly darker than the resting state to produce the effect of moving further from the viewer / being pushed down.
  private get bgAccentActive() {
    const color = this.bgAccent.clone();

    // “Slightly darker” is very dependent on the initial amount of lightness as well as how light (or dark) the surroundings are.
    if (this.seedLightness < 0.4) {
      color.oklch.l = this.bgAccent.oklch.l - 0.02;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l = this.bgAccent.oklch.l - 0.04;
    }

    if (this.seedLightness >= 0.7 && this.seedLightness < 0.85) {
      color.oklch.l = this.bgAccent.oklch.l - 0.05;
    }

    if (this.seedLightness >= 0.85) {
      color.oklch.l = this.bgAccent.oklch.l - 0.13;
    }

    return color;
  }

  // Subtle variant of bgAccent. Darker and less saturated.
  private get bgAccentSubtle() {
    const color = this.seedColor.clone();

    if (this.seedLightness > 0.3) {
      color.oklch.l = 0.3;
    }

    // If the color is too dark it won't be visible against bg.
    if (this.seedLightness < 0.2) {
      color.oklch.l = 0.2;
    }

    if (this.seedChroma > 0.112) {
      color.oklch.c = 0.112;
    }

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    return color;
  }

  private get bgAccentSubtleHover() {
    const color = this.bgAccentSubtle.clone();

    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgAccentSubtleActive() {
    const color = this.bgAccentSubtle.clone();

    color.oklch.l = color.oklch.l - 0.02;

    return color;
  }

  // Positive background, green.
  private get bgPositive() {
    const color = new Color("oklch", [0.62, 0.17, 145]);

    // If the seed color is also green, adjust positive by hue to make it distinct from accent.
    if (this.seedIsGreen && this.seedColor.oklch.c > 0.09) {
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
    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgPositiveActive() {
    const color = this.bgPositive.clone();

    // Lightness of bgPositive is known, no additional checks like in bgAccentActive
    color.oklch.l = color.oklch.l - 0.04;

    return color;
  }

  private get bgPositiveSubtle() {
    const color = this.bgPositive.clone();

    color.oklch.l = 0.25;
    color.oklch.c = 0.08;

    return color;
  }

  private get bgPositiveSubtleHover() {
    const color = this.bgPositiveSubtle.clone();

    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgPositiveSubtleActive() {
    const color = this.bgPositiveSubtle.clone();

    color.oklch.l = color.oklch.l - 0.02;

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
    color.oklch.l = color.oklch.l + 0.04;

    return color;
  }

  private get bgWarningActive() {
    const color = this.bgWarning.clone();

    // Lightness of bgWarning is known, no additional checks like in bgAccentActive
    color.oklch.l = color.oklch.l - 0.05;

    return color;
  }

  private get bgWarningSubtle() {
    const color = this.bgWarning.clone();

    color.oklch.l = 0.25;
    color.oklch.c = 0.05;

    return color;
  }

  private get bgWarningSubtleHover() {
    const color = this.bgWarningSubtle.clone();

    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgWarningSubtleActive() {
    const color = this.bgWarningSubtle.clone();

    color.oklch.l = color.oklch.l - 0.02;

    return color;
  }

  // Negative background, red.
  private get bgNegative() {
    const color = new Color("oklch", [0.55, 0.22, 27]);

    // If seed is red adjust negative by hue to make it distinct
    if (this.seedIsRed && this.seedColor.oklch.c > 0.07) {
      if (this.seedColor.oklch.h < 27) {
        color.oklch.h = 32;
      }
      if (this.seedColor.oklch.h >= 27) {
        color.oklch.h = 22;
      }
    }

    return color;
  }

  private get bgNegativeHover() {
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bgAccentHover
    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgNegativeActive() {
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bgAccentActive
    color.oklch.l = color.oklch.l - 0.04;

    return color;
  }

  private get bgNegativeSubtle() {
    const color = this.bgNegative.clone();

    color.oklch.l = 0.2;
    color.oklch.c = 0.08;

    return color;
  }

  private get bgNegativeSubtleHover() {
    const color = this.bgNegativeSubtle.clone();

    color.oklch.l = color.oklch.l + 0.03;

    return color;
  }

  private get bgNegativeSubtleActive() {
    const color = this.bgNegativeSubtle.clone();

    color.oklch.l = color.oklch.l - 0.02;

    return color;
  }

  private get bgNeutral() {
    return "#f5f7fa";
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
  // Applies to static text and similar. In dark mode it is light (and therefore desatured) tint of user-set seed color.
  // This ensures harmonious combination with main accents and neutrals.
  private get fg() {
    const color = this.seedColor.clone();

    // If seed color didn't have substantial amount of chroma make sure fg is achromatic.
    if (this.seedIsAchromatic) {
      color.oklch.l = 0.965;
      color.oklch.c = 0;
      return color;
    }

    color.oklch.l = 0.965;
    color.oklch.c = 0.024;
    return color;
  }

  // Accent foreground/content color.
  private get fgAccent() {
    const color = this.seedColor.clone();

    // For light content on dark background APCA contrast is negative. −60 is “The minimum level recommended for content text that is not body, column, or block text. In other words, text you want people to read.” Failure to reach this contrast level is most likely due to low lightness. Lightness and chroma are set to ones that reach the threshold universally irregardless of hue.
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

  // Negative foreground is produced from the initially adjusted background color (see above). Additional tweaks are applied to make sure it's distinct from fgAccent when seed is red.
  private get fgNegative() {
    const color = this.bgNegative.clone();
    color.oklch.l = color.oklch.l + 0.05;
    color.oklch.c = color.oklch.c + 0.1;
    color.oklch.h = color.oklch.h - 10;

    if (
      this.seedIsRed &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l < 0.5 &&
      this.fgAccent.oklch.h < 27
    ) {
      color.oklch.l = color.oklch.l + 0.05;
      color.oklch.c = color.oklch.c + 0.05;
      color.oklch.h = color.oklch.h - 15;
    }

    return color;
  }

  private get fgNeutral() {
    return this.bdNeutral.clone();
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
    tint.oklch.l = 0.94;
    shade.oklch.l = 0.27;

    // Check which of them has better contrast with bgAccent
    if (-this.bgAccent.contrastAPCA(tint) < this.bgAccent.contrastAPCA(shade)) {
      return shade;
    }

    return tint;
  }

  private get fgOnAssistive() {
    return this.bg.clone();
  }

  // Positive foreground is produced from the initially adjusted background color (see above). Additional tweaks are applied to make sure it's distinct from fgAccent when seed is green.
  private get fgPositive() {
    const color = this.bgPositive.clone();

    color.oklch.l = color.oklch.l + 0.08;

    if (
      this.seedIsGreen &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l > 0.5 &&
      this.fgAccent.oklch.h < 145
    ) {
      color.oklch.h = color.oklch.h - 5;
    }

    return color;
  }

  // Warning foreground is produced from the initially adjusted background color (see above).
  private get fgWarning() {
    const color = this.bgWarning.clone();

    // Yellow hue interval in OKLCh is less symmetrical than green, compensation is applied to results of bgNegative
    color.oklch.l = color.oklch.l + 0.12;
    color.oklch.c = color.oklch.c + 0.1;
    color.oklch.h = color.oklch.h - 9;

    return color;
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

  /*
   * Border colors
   */
  private get bdAccent() {
    const color = this.seedColor.clone();

    // For light content on dark background APCA contrast is negative. −15 is “The absolute minimum for any non-text that needs to be discernible and differentiable, but does not apply to semantic non-text such as icons”. In practice, thin borders are perceptually too subtle when using this as a threshould. −25 is used as the required minimum instead. Failure to reach this contrast level is most likely due to high lightness. Lightness and chroma are set to ones that reach the threshold universally irregardless of hue.
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

  // Keyboard focus outline. Opposite complimentary hue to the seed.
  private get bdFocus() {
    const color = this.seedColor.clone();

    color.oklch.h = this.seedHue - 180;

    // Set minimal lightness
    if (this.seedLightness < 0.4) {
      color.oklch.l = 0.4;
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
      color.oklch.l = color.oklch.l + 0.18;
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

    if (this.bdNegative.oklch.l < 0.8) {
      color.oklch.l = color.oklch.l + 0.15;
    }

    if (this.bdNegative.oklch.l >= 0.8 && this.bdNegative.oklch.l < 0.9) {
      color.oklch.l = color.oklch.l + 0.1;
    }

    if (this.bdNegative.oklch.l >= 0.9) {
      color.oklch.l = color.oklch.l - 0.25;
    }

    if (color.oklch.c < 0.19) {
      color.oklch.c = 0.19;
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

  private get bdPositive() {
    const color = this.bgPositive.clone();

    color.oklch.l = color.oklch.l + 0.05;
    color.oklch.c = color.oklch.c + 0.05;

    return color;
  }

  private get bdWarning() {
    const color = this.bgWarning.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.15 &&
      this.bdAccent.oklch.h < 85 &&
      this.bdAccent.oklch.h >= 60
    ) {
      color.oklch.l = color.oklch.l + 0.18;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.15 &&
      this.bdAccent.oklch.h >= 85 &&
      this.bdAccent.oklch.h < 110
    ) {
      color.oklch.h = color.oklch.h - 5;
      color.oklch.l = color.oklch.l + 0.05;
    }

    return color;
  }

  private get bdWarningHover() {
    const color = this.bdWarning.clone();

    if (this.bdWarning.oklch.l < 0.8) {
      color.oklch.l = color.oklch.l + 0.15;
    }

    if (this.bdWarning.oklch.l >= 0.8 && this.bdWarning.oklch.l < 0.9) {
      color.oklch.l = color.oklch.l + 0.1;
    }

    if (this.bdWarning.oklch.l >= 0.9) {
      color.oklch.l = color.oklch.l - 0.25;
    }

    if (color.oklch.c < 0.19) {
      color.oklch.c = 0.19;
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
}
