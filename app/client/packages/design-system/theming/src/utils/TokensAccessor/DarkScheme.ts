import { contrast, lighten, setLch } from "../colorUtils";
import type { ColorTypes } from "colorjs.io/types/src/color";
import { ColorsAccessor } from "../ColorsAccessor";

export class DarkScheme {
  private readonly seedColor: string;
  private readonly seedLightness: number;
  private readonly seedChroma: number;
  private readonly seedHue: number;
  private readonly seedIsVeryDark: boolean;

  constructor(private color: ColorTypes) {
    const { chroma, hex, hue, isVeryDark, lightness } = new ColorsAccessor(
      color,
    );
    this.seedColor = hex;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
    this.seedHue = hue;
    this.seedIsVeryDark = isVeryDark;
  }

  public getColors = () => {
    return {
      bgAccent: this.bgAccent,
      bgAccentHover: this.bgAccentHover,
      bgAccentActive: this.bgAccentActive,
      bgAccentSubtleHover: this.bgAccentSubtleHover,
      bgAccentSubtleActive: this.accentSubtleActive,
      bdAccent: this.bdAccent,
      bdFocus: this.bdFocus,
      bdNeutral: this.bdNeutral,
      fgAccent: this.fgAccent,
      fgOnAccent: this.fgOnAccent,
      bg: this.bg,
      fg: this.fg,
    };
  };

  private get bgAccent() {
    if (this.seedIsVeryDark) {
      return setLch(this.seedColor, {
        l: 0.3,
      });
    }

    return this.seedColor;
  }

  private get bgAccentHover() {
    return lighten(this.bgAccent, 1.04);
  }

  private get bgAccentActive() {
    return lighten(this.bgAccentHover, 0.94);
  }

  // used only for generating child colors, not used as a token
  private get accentSubtle() {
    let currentColor = this.seedColor;

    if (this.seedLightness > 0.3) {
      currentColor = setLch(currentColor, {
        l: 0.3,
      });
    }

    if (this.seedChroma > 0.112) {
      currentColor = setLch(currentColor, {
        c: 0.112,
      });
    }

    return currentColor;
  }

  private get bgAccentSubtleHover() {
    return lighten(this.accentSubtle, 1.03);
  }

  private get accentSubtleActive() {
    return lighten(this.accentSubtle, 0.9);
  }

  private get bdAccent() {
    if (contrast(this.seedColor, this.bg) <= 15) {
      return setLch(this.seedColor, {
        l: 0.985,
        c: 0.016,
      });
    }

    return this.seedColor;
  }

  private get bdFocus() {
    let currentColor = this.seedColor;

    currentColor = setLch(currentColor, { h: this.seedHue - 180 });

    if (this.seedLightness < 0.4) {
      currentColor = setLch(currentColor, { l: 0.4 });
    }

    return currentColor;
  }

  private get bdNeutral() {
    if (contrast(this.seedColor, this.bg) >= -25) {
      return setLch(this.seedColor, {
        c: 0.008,
      });
    }

    return setLch(this.seedColor, {
      l: 0.15,
      c: 0.064,
    });
  }

  private get fgAccent() {
    if (contrast(this.seedColor, this.bg) <= 60) {
      return setLch(this.seedColor, {
        l: 0.79,
        c: 0.136,
      });
    }

    return this.seedColor;
  }

  private get fgOnAccent() {
    if (contrast(this.seedColor, this.bg) <= 40) {
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

  private get bg() {
    return setLch(this.seedColor, {
      l: 0.15,
      c: 0.064,
    });
  }

  private get fg() {
    return setLch(this.seedColor, {
      l: 0.965,
      c: 0.024,
    });
  }
}
