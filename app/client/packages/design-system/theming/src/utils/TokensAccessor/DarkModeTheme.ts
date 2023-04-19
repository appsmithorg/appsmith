import { contrast, lighten, setLch } from "../colorUtils";
import { ColorsAccessor } from "../ColorsAccessor";

import type { ColorTypes } from "colorjs.io/types/src/color";
import type { ColorModeTheme } from "./types";

export class DarkModeTheme implements ColorModeTheme {
  private readonly seedColor: string;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsVeryDark: boolean;
  private readonly seedIsAchromatic: boolean;

  constructor(private color: ColorTypes) {
    const { chroma, hex, hue, isAchromatic, isVeryDark, lightness } =
      new ColorsAccessor(color);
    this.seedColor = hex;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
    this.seedHue = hue;
    this.seedIsVeryDark = isVeryDark;
    this.seedIsAchromatic = isAchromatic;
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
      bdAccent: this.bdAccent,
      bdFocus: this.bdFocus,
      bdNeutral: this.bdNeutral,
      bdNeutralHover: this.bdNeutralHover,
      bdNegative: this.bdNegative,
      bdNegativeHover: this.bdNegativeHover,
    };
  };

  /*
   * Background colors
   */
  private get bg() {
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

  private get bgAccent() {
    if (this.seedIsVeryDark) {
      return setLch(this.seedColor, {
        l: 0.3,
      });
    }

    return this.seedColor;
  }

  private get bgAccentHover() {
    return lighten(this.bgAccent, 1.06);
  }

  private get bgAccentActive() {
    return lighten(this.bgAccentHover, 0.9);
  }

  // used only for generating child colors, not used as a token
  private get bgAccentSubtle() {
    let currentColor = this.seedColor;

    if (this.seedLightness > 0.3) {
      currentColor = setLch(currentColor, {
        l: 0.3,
      });
    }

    if (this.seedChroma > 0.112 && !this.seedIsAchromatic) {
      currentColor = setLch(currentColor, {
        c: 0.112,
      });
    }

    return currentColor;
  }

  private get bgAccentSubtleHover() {
    return lighten(this.bgAccentSubtle, 1.06);
  }

  private get bgAccentSubtleActive() {
    return lighten(this.bgAccentSubtle, 0.9);
  }

  /*
   * Foreground colors
   */
  private get fg() {
    if (this.seedIsAchromatic) {
      return setLch(this.seedColor, {
        l: 0.965,
        c: 0,
      });
    }

    return setLch(this.seedColor, {
      l: 0.965,
      c: 0.024,
    });
  }

  private get fgAccent() {
    if (contrast(this.seedColor, this.bg) <= 60) {
      if (this.seedIsAchromatic) {
        return setLch(this.seedColor, {
          l: 0.79,
          c: 0,
        });
      }

      return setLch(this.seedColor, {
        l: 0.79,
        c: 0.136,
      });
    }

    return this.seedColor;
  }

  private get fgOnAccent() {
    if (contrast(this.seedColor, this.bg) <= 40) {
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

  private get bdAccent() {
    if (contrast(this.seedColor, this.bg) <= 15) {
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

    return this.seedColor;
  }

  private get bdNeutral() {
    if (contrast(this.seedColor, this.bg) >= -25 && !this.seedIsAchromatic) {
      return setLch(this.seedColor, {
        c: 0.008,
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

    if (this.seedLightness < 0.4) {
      currentColor = setLch(currentColor, { l: 0.4 });
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
