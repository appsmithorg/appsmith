import { contrast, lighten, setLch } from "../colorUtils";
import type { ColorTypes } from "colorjs.io/types/src/color";
import { ColorsAccessor } from "../ColorsAccessor";

export class LightScheme {
  private readonly seedColor: string;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;

  constructor(private color: ColorTypes) {
    const { chroma, hex, hue, lightness } = new ColorsAccessor(color);
    this.seedColor = hex;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
    this.seedHue = hue;
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
    return setLch(this.seedColor, {
      l: 0.985,
      c: 0.016,
    });
  }

  private get bgAccent() {
    if (contrast(this.seedColor, this.bg) >= -15) {
      return setLch(this.seedColor, {
        l: 0.85,
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

    if (this.seedLightness < 0.9) {
      currentColor = setLch(currentColor, {
        l: 0.9,
      });
    }

    if (this.seedChroma > 0.16) {
      currentColor = setLch(currentColor, {
        c: 0.16,
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
    return setLch(this.seedColor, {
      l: 0.12,
      c: 0.032,
    });
  }

  private get fgAccent() {
    if (contrast(this.seedColor, this.bg) >= -60) {
      return setLch(this.seedColor, {
        l: 0.25,
        c: 0.064,
      });
    }

    return this.seedColor;
  }

  private get fgOnAccent() {
    if (contrast(this.seedColor, this.bg) <= -60) {
      return setLch(this.seedColor, {
        l: 0.985,
        c: 0.016,
      });
    }

    return setLch(this.seedColor, {
      l: 0.15,
      c: 0.064,
    });
  }

  /*
   * Border colors
   */
  private get bdAccent() {
    if (contrast(this.seedColor, this.bg) >= -25) {
      return setLch(this.seedColor, {
        l: 0.15,
        c: 0.064,
      });
    }

    return this.seedColor;
  }

  private get bdNeutral() {
    if (contrast(this.seedColor, this.bg) <= -25) {
      return setLch(this.seedColor, {
        c: 0.016,
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
