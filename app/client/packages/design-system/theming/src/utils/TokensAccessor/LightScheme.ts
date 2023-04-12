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

  get bgAccent() {
    if (contrast(this.seedColor, this.bg) >= -15) {
      return setLch(this.seedColor, {
        l: 0.85,
      });
    }

    return this.seedColor;
  }

  get bgAccentHover() {
    return lighten(this.bgAccent, 1.06);
  }

  get bgAccentActive() {
    return lighten(this.bgAccentHover, 0.98);
  }

  // used only for generating child colors, not used as a token
  get accentSubtle() {
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

  get bgAccentSubtleHover() {
    return lighten(this.accentSubtle, 0.98);
  }

  get accentSubtleActive() {
    return lighten(this.accentSubtle, 1.03);
  }

  get bdAccent() {
    if (contrast(this.seedColor, this.bg) >= -25) {
      return setLch(this.seedColor, {
        l: 0.15,
        c: 0.064,
      });
    }

    return this.seedColor;
  }

  get bdFocus() {
    let currentColor = this.seedColor;

    currentColor = setLch(currentColor, { h: this.seedHue - 180 });

    if (this.seedLightness > 0.7) {
      currentColor = setLch(currentColor, { l: 0.7 });
    }

    return currentColor;
  }

  get bdNeutral() {
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

  get fgAccent() {
    if (contrast(this.seedColor, this.bg) >= -60) {
      return setLch(this.seedColor, {
        l: 0.25,
        c: 0.064,
      });
    }

    return this.seedColor;
  }

  get fgOnAccent() {
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

  get bg() {
    return setLch(this.seedColor, {
      l: 0.985,
      c: 0.016,
    });
  }

  get fg() {
    return setLch(this.seedColor, {
      l: 0.12,
      c: 0.032,
    });
  }
}
