import { contrast, lighten, setLch } from "../colorUtils";
import { ColorsAccessor } from "../ColorsAccessor";

import type { ColorTypes } from "colorjs.io/types/src/color";
import type { ColorModeTheme } from "./types";

export class LightModeTheme implements ColorModeTheme {
  private readonly seedColor: string;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsAchromatic: boolean;
  private readonly seedIsCold: boolean;
  private readonly seedIsVeryLight: boolean;

  constructor(private color: ColorTypes) {
    const { chroma, hex, hue, isAchromatic, isCold, isVeryLight, lightness } =
      new ColorsAccessor(color);
    this.seedColor = hex;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
    this.seedHue = hue;
    this.seedIsAchromatic = isAchromatic;
    this.seedIsCold = isCold;
    this.seedIsVeryLight = isVeryLight;
  }

  public getColors = () => {
    return {
      bg: this.bg,
      bgAccent: this.bgAccent,
      bgAccentHover: this.bgAccentHover,
      bgAccentActive: this.bgAccentActive,
      bgAccentSubtleHover: this.bgAccentSubtleHover,
      bgAccentSubtleActive: this.bgAccentSubtleActive,
      fg: this.fg,
      fgAccent: this.fgAccent,
      fgOnAccent: this.fgOnAccent,
      fgNegative: this.fgNegative,
      bdAccent: this.bdAccent,
      bdNeutral: this.bdNeutral,
      bdNeutralHover: this.bdNeutralHover,
      bdFocus: this.bdFocus,
      bdNegative: this.bdNegative,
      bdNegativeHover: this.bdNegativeHover,
    };
  };

  /*
   * Background colors
   */
  private get bg() {
    let currentColor = this.seedColor;

    if (this.seedIsVeryLight) {
      currentColor = setLch(currentColor, {
        l: 0.9,
      });
    }

    if (!this.seedIsVeryLight) {
      currentColor = setLch(currentColor, {
        l: 0.985,
      });
    }

    if (this.seedIsCold) {
      currentColor = setLch(currentColor, {
        c: 0.009,
      });
    }

    if (!this.seedIsCold) {
      currentColor = setLch(currentColor, {
        c: 0.007,
      });
    }

    if (this.seedIsAchromatic) {
      currentColor = setLch(currentColor, {
        c: 0,
      });
    }

    return currentColor;
  }

  private get bgAccent() {
    let currentColor = this.seedColor;

    if (this.seedIsVeryLight) {
      currentColor = setLch(currentColor, {
        l: 0.975,
      });
    }

    return currentColor;
  }

  private get bgAccentHover() {
    return lighten(this.bgAccent, 1.06);
  }

  private get bgAccentActive() {
    return lighten(this.bgAccent, 0.9);
  }

  // used only for generating child colors, not used as a token
  private get bgAccentSubtle() {
    let currentColor = this.seedColor;

    if (this.seedLightness < 0.94) {
      currentColor = setLch(currentColor, {
        l: 0.94,
      });
    }

    if (this.seedChroma > 0.1 && this.seedIsCold) {
      currentColor = setLch(currentColor, {
        c: 0.1,
      });
    }

    if (this.seedChroma > 0.06 && !this.seedIsCold) {
      currentColor = setLch(currentColor, {
        c: 0.06,
      });
    }

    if (this.seedIsAchromatic) {
      currentColor = setLch(currentColor, {
        c: 0,
      });
    }

    return currentColor;
  }

  private get bgAccentSubtleHover() {
    return lighten(this.bgAccentSubtle, 1.02);
  }

  private get bgAccentSubtleActive() {
    return lighten(this.bgAccentSubtle, 0.99);
  }

  /*
   * Foreground colors
   */
  private get fg() {
    if (this.seedIsAchromatic) {
      return setLch(this.seedColor, {
        l: 0.12,
        c: 0,
      });
    }

    return setLch(this.seedColor, {
      l: 0.12,
      c: 0.032,
    });
  }

  private get fgAccent() {
    if (contrast(this.seedColor, this.bg) >= -60) {
      if (this.seedIsAchromatic) {
        return setLch(this.seedColor, {
          l: 0.25,
          c: 0,
        });
      }

      return setLch(this.seedColor, {
        l: 0.25,
        c: 0.064,
      });
    }

    return this.seedColor;
  }

  private get fgOnAccent() {
    if (contrast(this.seedColor, this.bg) <= -60) {
      if (this.seedIsAchromatic) {
        return setLch(this.seedColor, {
          l: 0.985,
          c: 0,
        });
      }

      return setLch(this.seedColor, {
        l: 0.985,
        c: 0.016,
      });
    }

    if (this.seedIsAchromatic) {
      return setLch(this.seedColor, {
        l: 0.15,
        c: 0,
      });
    }

    return setLch(this.seedColor, {
      l: 0.15,
      c: 0.064,
    });
  }

  private get fgNegative() {
    return "#d91921";
  }

  /*
   * Border colors
   */
  private get bdAccent() {
    if (contrast(this.seedColor, this.bg) >= -25) {
      if (this.seedIsAchromatic) {
        return setLch(this.seedColor, {
          l: 0.15,
          c: 0,
        });
      }

      return setLch(this.seedColor, {
        l: 0.15,
        c: 0.064,
      });
    }

    return this.seedColor;
  }

  private get bdNeutral() {
    if (contrast(this.seedColor, this.bg) <= -25 && !this.seedIsAchromatic) {
      return setLch(this.seedColor, {
        c: 0.016,
      });
    }

    if (this.seedIsAchromatic) {
      return setLch(this.seedColor, {
        l: 0.15,
        c: 0,
      });
    }

    return setLch(this.seedColor, {
      l: 0.15,
      c: 0.064,
    });
  }

  private get bdNeutralHover() {
    return lighten(this.bdNeutral, 1.06);
  }

  private get bdFocus() {
    let currentColor = this.seedColor;

    currentColor = setLch(currentColor, { h: this.seedHue - 180 });

    if (this.seedLightness > 0.7) {
      currentColor = setLch(currentColor, { l: 0.7 });
    }

    return currentColor;
  }

  private get bdNegative() {
    return "#d91921";
  }

  private get bdNegativeHover() {
    return "#b90707";
  }
}
