import Color from "colorjs.io";
import { ColorsAccessor } from "./ColorsAccessor";

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
      bg: this.bg.to("sRGB").toString(),
      bgAccent: this.bgAccent.to("sRGB").toString(),
      bgAccentHover: this.bgAccentHover.to("sRGB").toString(),
      bgAccentActive: this.bgAccentActive.to("sRGB").toString(),
      bgAccentSubtle: this.bgAccentSubtle.to("sRGB").toString(),
      bgAccentSubtleHover: this.bgAccentSubtleHover.to("sRGB").toString(),
      bgAccentSubtleActive: this.bgAccentSubtleActive.to("sRGB").toString(),
      bgAssistive: this.bgAssistive.to("sRGB").toString(),
      bgNeutral: this.bgNeutral.to("sRGB").toString(),
      bgNeutralOpacity: this.bgNeutralOpacity.to("sRGB").toString(),
      bgNeutralHover: this.bgNeutralHover.to("sRGB").toString(),
      bgNeutralActive: this.bgNeutralActive.to("sRGB").toString(),
      bgNeutralSubtle: this.bgNeutralSubtle.to("sRGB").toString(),
      bgNeutralSubtleHover: this.bgNeutralSubtleHover.to("sRGB").toString(),
      bgNeutralSubtleActive: this.bgNeutralSubtleActive.to("sRGB").toString(),
      bgPositive: this.bgPositive.to("sRGB").toString(),
      bgPositiveHover: this.bgPositiveHover.to("sRGB").toString(),
      bgPositiveActive: this.bgPositiveActive.to("sRGB").toString(),
      bgPositiveSubtle: this.bgPositiveSubtle.to("sRGB").toString(),
      bgPositiveSubtleHover: this.bgPositiveSubtleHover.to("sRGB").toString(),
      bgPositiveSubtleActive: this.bgPositiveSubtleActive.to("sRGB").toString(),
      bgNegative: this.bgNegative.to("sRGB").toString(),
      bgNegativeHover: this.bgNegativeHover.to("sRGB").toString(),
      bgNegativeActive: this.bgNegativeActive.to("sRGB").toString(),
      bgNegativeSubtle: this.bgNegativeActive.to("sRGB").toString(),
      bgNegativeSubtleHover: this.bgNegativeSubtleHover.to("sRGB").toString(),
      bgNegativeSubtleActive: this.bgNegativeSubtleActive.to("sRGB").toString(),
      bgWarning: this.bgWarning.to("sRGB").toString(),
      bgWarningHover: this.bgWarningHover.to("sRGB").toString(),
      bgWarningActive: this.bgWarningActive.to("sRGB").toString(),
      bgWarningSubtle: this.bgWarningSubtle.to("sRGB").toString(),
      bgWarningSubtleHover: this.bgWarningSubtleHover.to("sRGB").toString(),
      bgWarningSubtleActive: this.bgWarningSubtleActive.to("sRGB").toString(),

      bgElevation1: this.bgElevation1.to("sRGB").toString(),
      bgElevation2: this.bgElevation2.to("sRGB").toString(),
      bgElevation3: this.bgElevation3.to("sRGB").toString(),

      fg: this.fg.to("sRGB").toString(),
      fgAccent: this.fgAccent.to("sRGB").toString(),
      fgNeutral: this.fgNeutral.to("sRGB").toString(),
      fgNeutralSubtle: this.fgNeutralSubtle.to("sRGB").toString(),
      fgPositive: this.fgPositive.to("sRGB").toString(),
      fgNegative: this.fgNegative.to("sRGB").toString(),
      fgWarning: this.fgWarning.to("sRGB").toString(),

      fgOnAccent: this.fgOnAccent.to("sRGB").toString(),
      fgOnAccentSubtle: this.fgOnAccentSubtle.to("sRGB").toString(),
      fgOnAssistive: this.fgOnAssistive.to("sRGB").toString(),
      fgOnNeutral: this.fgOnNeutral.to("sRGB").toString(),
      fgOnPositive: this.fgOnPositive.to("sRGB").toString(),
      fgOnNegative: this.fgOnNegative.to("sRGB").toString(),
      fgOnWarning: this.fgOnWarning.to("sRGB").toString(),

      bd: this.bd.to("sRGB").toString(),
      bdAccent: this.bdAccent.to("sRGB").toString(),
      bdFocus: this.bdFocus.to("sRGB").toString(),
      bdNeutral: this.bdNeutral.to("sRGB").toString(),
      bdNeutralHover: this.bdNeutralHover.to("sRGB").toString(),
      bdPositive: this.bdPositive.to("sRGB").toString(),
      bdPositiveHover: this.bdPositiveHover.to("sRGB").toString(),
      bdNegative: this.bdNegative.to("sRGB").toString(),
      bdNegativeHover: this.bdNegativeHover.to("sRGB").toString(),
      bdWarning: this.bdWarning.to("sRGB").toString(),
      bdWarningHover: this.bdWarningHover.to("sRGB").toString(),

      bdOnAccent: this.bdOnAccent.to("sRGB").toString(),
      bdOnNeutral: this.bdOnNeutral.to("sRGB").toString(),
      bdOnPositive: this.bdOnPositive.to("sRGB").toString(),
      bdOnNegative: this.bdOnNegative.to("sRGB").toString(),
      bdOnWarning: this.bdOnWarning.to("sRGB").toString(),
    };
  };

  /*
   * Background colors
   */

  private get bg() {
    // Main application background color.
    // Applies to canvas. In light mode it is extremely light (and therefore desatured) tint of user-set seed color.
    // This ensures harmonious combination with main accents and neutrals.
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

  private get bgAccent() {
    // Main accent color. Largely is the same as user-set seed color.
    const color = this.seedColor.clone();

    // If seed is very light, make bg darker than usual (see above). Make sure then, that the accent is bright enough.
    if (this.seedIsVeryLight) {
      color.oklch.l = 0.975;
    }

    return color;
  }

  private get bgAccentHover() {
    // Hover state of bgAccent. Slightly lighter than the resting state to produce the effect of moving closer to the viewer / inspection.
    const color = this.bgAccent.clone();

    // “Slightly lighter” is very dependent on the initial amount of lightness as well as how light (or dark) the surroundings are.
    if (this.seedLightness < 0.06) {
      color.oklch.l += 0.28;
    }

    if (this.seedLightness > 0.06 && this.seedLightness < 0.14) {
      color.oklch.l += 0.2;
    }

    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.21 &&
      this.seedIsCold
    ) {
      color.oklch.l += 0.1;
    }

    // Warm colors require a little bit more lightness in this range than colds to be sufficiently perceptually lighter.
    if (
      this.seedLightness >= 0.14 &&
      this.seedLightness < 0.21 &&
      !this.seedIsCold
    ) {
      color.oklch.l += 0.13;
    }

    if (this.seedLightness >= 0.21 && this.seedLightness < 0.4) {
      color.oklch.l += 0.09;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l += 0.05;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l += 0.03;
    }

    // For very light seeds it's impossible to produce hover state that is sufficiently perceptibly lighter, therefore switching to darker hovers.
    // Yellow has largest amount of chroma available at the top (by lightness) of OKLCh space, compensating by slightly decreasing chroma and decreasing lightness.
    if (this.seedIsVeryLight && this.seedIsYellow) {
      color.oklch.l = 0.945;
      color.oklch.c *= 0.93;
    }

    if (this.seedIsVeryLight && !this.seedIsYellow) {
      color.oklch.l = 0.95;
      color.oklch.c *= 1.15;
    }

    return color;
  }

  public get bgAccentActive() {
    // Active state of bgAccent. Slightly darker than the resting state to produce the effect of moving further from the viewer / being pushed down.
    const color = this.bgAccent.clone();

    // “Slightly darker” is very dependent on the initial amount of lightness as well as how light (or dark) the surroundings are.
    if (this.seedLightness < 0.4) {
      color.oklch.l -= 0.04;
    }

    if (this.seedLightness >= 0.4 && this.seedLightness < 0.7) {
      color.oklch.l -= 0.02;
    }

    if (this.seedLightness >= 0.7) {
      color.oklch.l -= 0.01;
    }

    // For very light seeds complement the effect with increased chroma.
    if (this.seedIsVeryLight) {
      color.oklch.l = 0.935;
      color.oklch.c *= 1.15;
    }

    return color;
  }

  private get bgAccentSubtle() {
    // Subtle variant of bgAccent. Lighter and less saturated.
    const color = this.seedColor.clone();

    if (this.seedIsVeryLight) {
      color.oklch.l = 0.955;
    }

    if (!this.seedIsVeryLight) {
      color.oklch.l = 0.93;
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

    color.oklch.l += 0.02;

    return color;
  }

  private get bgAccentSubtleActive() {
    const color = this.bgAccentSubtle.clone();

    color.oklch.l -= 0.01;

    return color;
  }

  private get bgAssistive() {
    const color = this.seedColor.clone();

    // Background color for assistive UI elements (e.g. tooltip); dark to stand out against bg
    color.oklch.l = 0.16;
    color.oklch.c = 0.07;

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    return color;
  }

  private get bgNeutralOpacity() {
    const color = this.bgNeutral.clone();

    color.alpha = 0.5;

    return color;
  }

  private get bgNeutral() {
    // Low chroma, but not 0, if possible, to produce harmony with accents in the UI
    const color = this.bgAccent.clone();

    // For bright accents it helps to make neutral a bit darker to differentiate with bgAccent
    if (this.bgAccent.oklch.l >= 0.85) {
      color.oklch.l -= 0.02;
    }

    if (this.bgAccent.oklch.l > 0.25 && this.bgAccent.oklch.l < 0.85) {
      color.oklch.l -= 0.1;
    }

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    if (this.seedIsCold && !this.seedIsAchromatic) {
      color.oklch.c = 0.03;
    }

    if (!this.seedIsCold && !this.seedIsAchromatic) {
      color.oklch.c = 0.015;
    }

    return color;
  }

  private get bgNeutralHover() {
    const color = this.bgNeutral.clone();

    // Simplified and adjusted version of bgAccentHover algorithm (bgNeutral has very low or no chroma)

    if (this.bgNeutral.oklch.l < 0.06) {
      color.oklch.l += 0.24;
    }

    if (this.bgNeutral.oklch.l > 0.06 && this.bgNeutral.oklch.l < 0.14) {
      color.oklch.l += 0.14;
    }

    if (this.bgNeutral.oklch.l >= 0.14 && this.bgNeutral.oklch.l < 0.21) {
      color.oklch.l += 0.07;
    }

    if (this.bgNeutral.oklch.l >= 0.21 && this.bgNeutral.oklch.l < 0.7) {
      color.oklch.l += 0.05;
    }

    if (this.bgNeutral.oklch.l >= 0.7 && this.bgNeutral.oklch.l < 0.955) {
      color.oklch.l += 0.03;
    }

    if (this.bgNeutral.oklch.l >= 0.955) {
      color.oklch.l = 0.94;
    }

    return color;
  }

  private get bgNeutralActive() {
    const color = this.bgNeutral.clone();

    // Simplified and adjusted version of bgAccentActive algorithm (bgNeutral has very low or no chroma)
    if (this.bgNeutral.oklch.l < 0.4) {
      color.oklch.l -= 0.03;
    }

    if (this.bgNeutral.oklch.l >= 0.4 && this.bgNeutral.oklch.l < 0.955) {
      color.oklch.l -= 0.01;
    }

    if (this.bgNeutral.oklch.l >= 0.955) {
      color.oklch.l = 0.925;
    }

    return color;
  }

  private get bgNeutralSubtle() {
    const color = this.seedColor.clone();

    // Adjusted version of bgAccentSubtle (less or no chroma)
    if (this.seedIsVeryLight) {
      color.oklch.l = 0.955;
    }

    if (!this.seedIsVeryLight) {
      color.oklch.l = 0.93;
    }

    if (this.seedChroma > 0.01) {
      color.oklch.c = 0.01;
    }

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    return color;
  }

  private get bgNeutralSubtleHover() {
    const color = this.bgNeutralSubtle.clone();

    color.oklch.l += 0.02;

    return color;
  }

  private get bgNeutralSubtleActive() {
    const color = this.bgNeutralSubtle.clone();

    color.oklch.l -= 0.01;

    return color;
  }

  private get bgPositive() {
    // Positive background, green.
    const color = new Color("oklch", [0.62, 0.19, 145]);

    // If the seed color is also green, adjust positive by hue to make it distinct from accent.
    if (this.seedIsGreen && this.seedChroma > 0.11) {
      if (this.seedHue < 145) {
        color.oklch.h = 155;
      }
      if (this.seedHue >= 145) {
        color.oklch.h = 135;
      }
    }

    return color;
  }

  private get bgPositiveHover() {
    const color = this.bgPositive.clone();

    // Lightness of bgPositive is known, no additional checks like in bgAccentHover
    color.oklch.l += 0.05;

    return color;
  }

  private get bgPositiveActive() {
    const color = this.bgPositive.clone();

    // Lightness of bgPositive is known, no additional checks like in bgAccentActive
    color.oklch.l -= 0.02;

    return color;
  }

  private get bgPositiveSubtle() {
    const color = this.bgPositive.clone();

    color.oklch.l = 0.955;
    color.oklch.c = 0.08;

    return color;
  }

  private get bgPositiveSubtleHover() {
    const color = this.bgPositiveSubtle.clone();

    color.oklch.l += 0.02;

    return color;
  }

  private get bgPositiveSubtleActive() {
    const color = this.bgPositiveSubtle.clone();

    color.oklch.l -= 0.01;

    return color;
  }

  private get bgNegative() {
    // Negative background, red.
    const color = new Color("oklch", [0.55, 0.22, 27]);

    // If seed is red adjust negative by hue to make it distinct
    if (this.seedIsRed && this.seedChroma > 0.12) {
      if (this.seedHue < 27) {
        color.oklch.h = 34;
      }
      if (this.seedHue >= 27) {
        color.oklch.h = 20;
      }
    }

    return color;
  }

  private get bgNegativeHover() {
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bgAccentHover
    color.oklch.l += 0.05;

    return color;
  }

  private get bgNegativeActive() {
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bgAccentActive
    color.oklch.l -= 0.02;

    return color;
  }

  private get bgNegativeSubtle() {
    const color = this.bgNegative.clone();

    color.oklch.l = 0.95;
    color.oklch.c = 0.05;

    return color;
  }

  private get bgNegativeSubtleHover() {
    const color = this.bgNegativeSubtle.clone();

    color.oklch.l += 0.02;

    return color;
  }

  private get bgNegativeSubtleActive() {
    const color = this.bgNegativeSubtle.clone();

    color.oklch.l -= 0.01;

    return color;
  }

  private get bgWarning() {
    // Warning background, yellow
    const color = new Color("oklch", [0.75, 0.15, 85]);

    // Check for clashes with seed, adjust by hue to make it distinct
    if (this.seedIsYellow && this.seedChroma > 0.09) {
      if (this.seedHue < 85) {
        color.oklch.h = 95;
      }
      if (this.seedHue >= 85) {
        color.oklch.h = 70;
      }
    }

    return color;
  }

  private get bgWarningHover() {
    const color = this.bgWarning.clone();

    // Lightness of bgWarning is known, no additional checks like in bgAccentHover
    color.oklch.l += 0.03;

    return color;
  }

  private get bgWarningActive() {
    const color = this.bgWarning.clone();

    // Lightness of bgWarning is known, no additional checks like in bgAccentActive
    color.oklch.l -= 0.01;

    return color;
  }

  private get bgWarningSubtle() {
    const color = this.bgWarning.clone();

    color.oklch.l = 0.96;
    color.oklch.c = 0.05;

    return color;
  }

  private get bgWarningSubtleHover() {
    const color = this.bgWarningSubtle.clone();

    color.oklch.l += 0.02;

    return color;
  }

  private get bgWarningSubtleActive() {
    const color = this.bgWarningSubtle.clone();

    color.oklch.l -= 0.01;

    return color;
  }

  /*
   * Elevation colors
   */

  private get bgElevation1() {
    const color = this.bg.clone();

    color.oklch.l += 0.01;

    return color;
  }

  private get bgElevation2() {
    const color = this.bgElevation1.clone();

    color.oklch.l += 0.01;

    return color;
  }

  private get bgElevation3() {
    const color = this.bgElevation2.clone();

    color.oklch.l += 0.01;

    return color;
  }

  /*
   * Foreground colors
   */

  private get fg() {
    // Main application foreground color.
    // Applies to static text and similar. In light mode it is extremely dark (and therefore desatured) shade of user-set seed color.
    // This ensures harmonious combination with main accents and neutrals.
    const color = this.seedColor.clone();

    color.oklch.l = 0.12;

    // If seed color didn't have substantial amount of chroma make sure fg is achromatic.
    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    if (!this.seedIsAchromatic) {
      color.oklch.c = 0.032;
    }

    return color;
  }

  private get fgAccent() {
    // Accent foreground/content color.
    const color = this.seedColor.clone();

    // For dark content on light background APCA contrast is positive. 60 is “The minimum level recommended for content text that is not body, column, or block text. In other words, text you want people to read.” Failure to reach this contrast level is most likely due to high lightness. Lightness and chroma are set to ones that reach the threshold universally regardless of hue.
    if (this.bg.contrastAPCA(this.seedColor) <= 60) {
      color.oklch.l = 0.45;

      if (this.seedIsAchromatic) {
        color.oklch.c = 0;
      }

      if (!this.seedIsAchromatic) {
        color.oklch.c = 0.164;
      }
    }

    return color;
  }

  private get fgNeutral() {
    // Desatured version of the seed for harmonious combination with backgrounds and accents.
    const color = this.fgAccent.clone();

    // Minimal contrast that we set for fgAccent (60) is too low for a gray color
    if (this.bg.contrastAPCA(this.fgAccent) < 75) {
      color.oklch.l -= 0.1;
    }

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    if (this.seedIsCold && !this.seedIsAchromatic) {
      color.oklch.c = 0.05;
    }

    if (!this.seedIsCold && !this.seedIsAchromatic) {
      color.oklch.c = 0.015;
    }

    return color;
  }

  private get fgNeutralSubtle() {
    const color = this.fgNeutral.clone();

    color.oklch.l += 0.1;

    return color;
  }

  private get fgPositive() {
    // Positive foreground is produced from the initially adjusted background color (see above). Additional tweaks are applied to make sure it's distinct from fgAccent when seed is green.
    const color = this.bgPositive.clone();

    if (
      this.seedIsGreen &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l > 0.5 &&
      this.fgAccent.oklch.h < 145
    ) {
      color.oklch.c += 0.05;
      color.oklch.h -= 10;
    }

    return color;
  }

  private get fgNegative() {
    // Negative foreground is produced from the initially adjusted background color (see above). Additional tweaks are applied to make sure it's distinct from fgAccent when seed is red.
    const color = this.bgNegative.clone();

    // Red hue interval bgNegativein OKLCh is less symmetrical than green, compensation is applied to results of bgNegative
    color.oklch.l += 0.1;
    color.oklch.c += 0.1;
    color.oklch.h -= 10;

    if (
      this.seedIsRed &&
      !this.seedIsAchromatic &&
      this.fgAccent.oklch.l > 0.5 &&
      this.fgAccent.oklch.h < 27
    ) {
      color.oklch.c += 0.05;
      color.oklch.h -= 10;
    }

    return color;
  }

  private get fgWarning() {
    // Warning foreground is produced from the initially adjusted background color (see above).
    const color = this.bgWarning.clone();

    // Yellow hue interval in OKLCh is less symmetrical than green, compensation is applied to results of bgNegative
    color.oklch.l -= 0.1;
    color.oklch.c += 0.1;
    color.oklch.h -= 9;

    return color;
  }

  private get fgOnAccent() {
    // Foreground for content on top of bgAccent
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

  private get fgOnAccentSubtle() {
    return this.fg.clone();
  }

  private get fgOnAssistive() {
    // Unlike fgOnAccent we know that bgAssistive is dark in light mode
    const tint = this.bgAssistive.clone();

    tint.oklch.l = 0.97;

    return tint;
  }

  private get fgOnNeutral() {
    // Simplified and adjusted version of fgOnAccent
    const tint = this.bgNeutral.clone();
    const shade = this.bgNeutral.clone();

    // Light and dark derivatives of the bgNeutral
    tint.oklch.l = 0.96;
    shade.oklch.l = 0.22;

    // Check which of them has better contrast with bgNeutral
    if (
      -this.bgNeutral.contrastAPCA(tint) >= this.bgNeutral.contrastAPCA(shade)
    ) {
      return tint;
    }

    return shade;
  }

  private get fgOnPositive() {
    // Simplified and adjusted version of fgOnAccent
    const tint = this.bgPositive.clone();
    const shade = this.bgPositive.clone();

    // Light and dark derivatives of the bgPositive
    tint.oklch.l = 0.97;
    shade.oklch.l = 0.25;

    // Check which of them has better contrast with bgPositive
    if (
      -this.bgPositive.contrastAPCA(tint) >= this.bgPositive.contrastAPCA(shade)
    ) {
      return tint;
    }

    return shade;
  }

  private get fgOnNegative() {
    // Simplified and adjusted version of fgOnAccent
    const tint = this.bgNegative.clone();
    const shade = this.bgNegative.clone();

    // Light and dark derivatives of the bgNegative
    tint.oklch.l = 0.95;
    shade.oklch.l = 0.25;

    // Check which of them has better contrast with bgNegative
    if (
      -this.bgNegative.contrastAPCA(tint) >= this.bgNegative.contrastAPCA(shade)
    ) {
      return tint;
    }

    return shade;
  }

  private get fgOnWarning() {
    // Simplified and adjusted version of fgOnAccent
    const tint = this.bgWarning.clone();
    const shade = this.bgWarning.clone();

    // Light and dark derivatives of the bgWarning
    tint.oklch.l = 0.95;
    shade.oklch.l = 0.25;

    // Check which of them has better contrast with bgWarning
    if (
      -this.bgWarning.contrastAPCA(tint) >= this.bgWarning.contrastAPCA(shade)
    ) {
      return tint;
    }

    return shade;
  }

  /*
   * Border colors
   */

  private get bd() {
    const color = this.fg.clone();

    color.oklch.l = 0.8;

    return color;
  }

  private get bdAccent() {
    // Accent border color
    const color = this.seedColor.clone();

    // For dark content on light background APCA contrast is positive. 15 is “The absolute minimum for any non-text that needs to be discernible and differentiable, but does not apply to semantic non-text such as icons”. In practice, thin borders are perceptually too subtle when using this as a threshould. 25 is used as the required minimum instead. Failure to reach this contrast level is most likely due to high lightness. Lightness and chroma are set to ones that reach the threshold universally regardless of hue.
    if (this.bg.contrastAPCA(this.seedColor) <= 25) {
      if (this.seedIsAchromatic) {
        color.oklch.l = 0.3;
        color.oklch.c = 0;
      }

      if (!this.seedIsAchromatic) {
        color.oklch.l = 0.55;
        color.oklch.c = 0.25;
      }
    }

    return color;
  }

  private get bdFocus() {
    // Keyboard focus outline
    const color = this.bdAccent.clone();

    // Achromatic seeds still produce colorful focus; this is good for accessibility even though it affects visual style
    if (this.seedChroma < 0.15) {
      color.oklch.c = 0.15;
    }

    return color;
  }

  private get bdNeutral() {
    // Desatured version of the seed for harmonious combination with backgrounds and accents.
    const color = this.bdAccent.clone();

    color.oklch.c = 0.035;

    if (this.seedIsAchromatic) {
      color.oklch.c = 0;
    }

    if (this.bg.contrastAPCA(color) < 25) {
      color.oklch.l -= 0.2;
    }

    return color;
  }

  private get bdNeutralHover() {
    const color = this.bdNeutral.clone();

    if (this.bdNeutral.oklch.l < 0.06) {
      color.oklch.l += 0.6;
    }

    if (this.bdNeutral.oklch.l >= 0.06 && this.bdNeutral.oklch.l < 0.25) {
      color.oklch.l += 0.4;
    }

    if (this.bdNeutral.oklch.l >= 0.25 && this.bdNeutral.oklch.l < 0.5) {
      color.oklch.l += 0.25;
    }

    if (this.bdNeutral.oklch.l >= 0.5) {
      color.oklch.l += 0.1;
    }

    return color;
  }

  private get bdPositive() {
    // Positive (green) border. Additional compensations are applied if seed is withing green range.
    const color = this.bgPositive.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.11 &&
      this.bdAccent.oklch.h < 145 &&
      this.bdAccent.oklch.h >= 116
    ) {
      color.oklch.l += 0.1;
      color.oklch.h += 5;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.11 &&
      this.bdAccent.oklch.h >= 145 &&
      this.bdAccent.oklch.h < 166
    ) {
      color.oklch.l += 0.05;
      color.oklch.h -= 5;
    }

    return color;
  }

  private get bdPositiveHover() {
    const color = this.bdPositive.clone();

    // Lightness of bdPositive is known, no additional checks like in bdNeutralHover
    color.oklch.l += 0.1;

    return color;
  }

  private get bdNegative() {
    // Negative (red) border. Produced out of bgNegative. Additional compensations are applied if seed is within red range.
    const color = this.bgNegative.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.15 &&
      this.bdAccent.oklch.h < 27 &&
      this.bdAccent.oklch.h >= 5
    ) {
      color.oklch.l += 0.1;
      color.oklch.h += 5;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.15 &&
      this.bdAccent.oklch.h >= 27 &&
      this.bdAccent.oklch.h < 50
    ) {
      color.oklch.l += 0.05;
      color.oklch.h -= 5;
    }

    return color;
  }

  private get bdNegativeHover() {
    const color = this.bdNegative.clone();

    // Lightness of bdNegative is known, no additional checks like in bdNeutralHover
    color.oklch.l += 0.1;

    return color;
  }

  private get bdWarning() {
    // Warning (yellow) border. Produced out of bgNegative. Additional compensations are applied if seed is within yellow range.
    const color = this.bgWarning.clone();

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.09 &&
      this.bdAccent.oklch.h < 85 &&
      this.bdAccent.oklch.h >= 60
    ) {
      color.oklch.l += 0.1;
      color.oklch.h += 10;
    }

    if (
      this.bdAccent.oklch.l > 0.5 &&
      this.bdAccent.oklch.c > 0.09 &&
      this.bdAccent.oklch.h >= 85 &&
      this.bdAccent.oklch.h < 110
    ) {
      color.oklch.l += 0.05;
      color.oklch.h -= 10;
    }

    return color;
  }

  private get bdWarningHover() {
    const color = this.bdWarning.clone();

    // Lightness of bdWarning is known, no additional checks like in bdNeutralHover
    color.oklch.l += 0.1;

    return color;
  }

  private get bdOnAccent() {
    // Separator on bgAccent, low contrast to not pull attention from actual separated content elements
    const color = this.bgAccent.clone();

    if (this.bgAccent.oklch.l >= 0.7) {
      color.oklch.l -= 0.25;
    }

    if (this.bgAccent.oklch.l < 0.7 && this.bgAccent.oklch.l >= 0.4) {
      color.oklch.l -= 0.33;
    }

    if (this.bgAccent.oklch.l < 0.4 && this.bgAccent.oklch.l >= 0.15) {
      color.oklch.l += 0.2;
    }

    if (this.bgAccent.oklch.l < 0.15) {
      color.oklch.l += 0.46;
    }

    return color;
  }

  private get bdOnNeutral() {
    // Separator on bgNeutral, low contrast to not pull attention from actual separated content elements
    const color = this.bgNeutral.clone();

    if (this.bgNeutral.oklch.l >= 0.7) {
      color.oklch.l -= 0.28;
    }

    if (this.bgNeutral.oklch.l < 0.7 && this.bgNeutral.oklch.l >= 0.4) {
      color.oklch.l -= 0.35;
    }

    if (this.bgNeutral.oklch.l < 0.4 && this.bgNeutral.oklch.l >= 0.15) {
      color.oklch.l += 0.22;
    }

    if (this.bgNeutral.oklch.l < 0.15) {
      color.oklch.l += 0.47;
    }

    return color;
  }

  private get bdOnPositive() {
    // Separator on bgPositive, low contrast to not pull attention from actual separated content elements
    const color = this.bgPositive.clone();

    // Lightness of bgPositive is known, no additional checks like in bdOnAccent / bdOnNeutral
    color.oklch.l -= 0.33;

    return color;
  }

  private get bdOnNegative() {
    // Separator on bgNegative, low contrast to not pull attention from actual separated content elements
    const color = this.bgNegative.clone();

    // Lightness of bgNegative is known, no additional checks like in bdOnAccent / bdOnNeutral
    color.oklch.l -= 0.33;

    return color;
  }

  private get bdOnWarning() {
    // Separator on bgWarning, low contrast to not pull attention from actual separated content elements
    const color = this.bgWarning.clone();

    // Lightness of bgWarning is known, no additional checks like in bdOnAccent / bdOnNeutral
    color.oklch.l -= 0.33;

    return color;
  }
}
