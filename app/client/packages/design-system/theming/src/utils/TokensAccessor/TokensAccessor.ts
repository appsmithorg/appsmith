import type { ColorTypes } from "colorjs.io/types/src/color";
import { defaultTokens } from "../../";
import range from "lodash/range";
import kebabCase from "lodash/kebabCase";
import { contrast, lighten, setLch, ColorsAccessor } from "../";

type TokenType =
  | "sizing"
  | "color"
  | "spacing"
  | "borderRadius"
  | "boxShadow"
  | "borderWidth"
  | "opacity";

type ColorScheme = "light" | "dark";

type Token = {
  value: string | number;
  type: TokenType;
};

export type ThemeTokens = {
  [key in TokenType]: { [key: string]: Token };
};

type TokenObj = { [key: string]: string | number };

export class TokensAccessor {
  private seedColor!: string;
  private seedLightness!: number;
  private seedChroma!: number;

  constructor(
    private color: ColorTypes = defaultTokens.seedColor,
    private colorScheme: ColorScheme = defaultTokens.colorScheme as ColorScheme,
    private rootUnit: number = defaultTokens.rootUnit,
    private borderRadius: TokenObj = defaultTokens.borderRadius,
    private boxShadow: TokenObj = defaultTokens.boxShadow,
    private borderWidth: TokenObj = defaultTokens.borderWidth,
    private opacity: TokenObj = defaultTokens.opacity,
  ) {
    this.updateSeedColor(color);
  }

  updateSeedColor = (color: ColorTypes) => {
    const { chroma, hex, lightness } = new ColorsAccessor(color);
    this.seedColor = hex;
    this.seedLightness = lightness;
    this.seedChroma = chroma;
  };

  updateColorScheme = (colorScheme: ColorScheme) => {
    this.colorScheme = colorScheme;
  };

  updateBorderRadius = (borderRadius: TokenObj) => {
    this.borderRadius = borderRadius;
    this.createTokenObject(this.borderRadius, "borderRadius");
  };

  getAllTokens = () => {
    return {
      ...this.getColors(),
      ...this.getSizing(),
      ...this.getSpacing(),
      ...this.getBorderRadius(),
      ...this.getBoxShadow(),
      ...this.getBorderWidth(),
      ...this.getOpacity(),
    };
  };

  getColors = () => {
    switch (true) {
      case this.isLightMode:
        return this.createTokenObject(this.getLightColors(), "color");
      case this.isDarkMode:
        return this.createTokenObject(this.getDarkColors(), "color");
      default:
        return this.createTokenObject(this.getLightColors(), "color");
    }
  };

  getSizing = () => {
    const sizing = {
      rootUnit: `${this.rootUnit}px`,
    };

    return this.createTokenObject(sizing, "sizing");
  };

  getSpacing = (count = 6) => {
    const spacing = range(count).reduce((acc, value, index) => {
      return {
        ...acc,
        [index]: `${this.rootUnit * value}px`,
      };
    }, {});

    return this.createTokenObject(spacing, "spacing");
  };

  getBorderRadius = () => {
    return this.createTokenObject(this.borderRadius, "borderRadius");
  };

  getBoxShadow = () => {
    return this.createTokenObject(this.boxShadow, "boxShadow");
  };

  getBorderWidth = () => {
    return this.createTokenObject(this.borderWidth, "borderWidth");
  };

  getOpacity = () => {
    return this.createTokenObject(this.opacity, "opacity");
  };

  private get isLightMode() {
    return this.colorScheme === "light";
  }

  private get isDarkMode() {
    return this.colorScheme === "dark";
  }

  private createTokenObject = (
    tokenObj: TokenObj,
    tokenType: TokenType,
  ): ThemeTokens => {
    const themeTokens = {} as ThemeTokens;

    Object.keys(tokenObj).forEach((key) => {
      themeTokens[tokenType] = {
        ...themeTokens[tokenType],
        [kebabCase(key)]: {
          value: tokenObj[key],
          type: tokenType,
        },
      };
    });

    return themeTokens;
  };

  /*
   * Light color scheme
   */
  private getLightColors = () => {
    return {
      bgAccent: this.lightBgAccent,
      bgAccentHover: this.lightBgAccentHover,
      bgAccentActive: this.lightBgAccentActive,
      bgAccentSubtleHover: this.lightBgAccentSubtleHover,
      bgAccentSubtleActive: this.lightAccentSubtleActive,
      bdAccent: this.lightBdAccent,
      fgAccent: this.lightFgAccent,
      fgOnAccent: this.lightFgOnAccent,
      bdFocus: this.lightBdFocus,
      bg: this.lightBg,
      fg: this.lightFg,
    };
  };

  private get lightBgAccent() {
    if (contrast(this.seedColor, this.lightBg) >= -15) {
      return setLch(this.seedColor, {
        l: 85,
      });
    }

    return this.seedColor;
  }

  private get lightBgAccentHover() {
    return lighten(this.lightBgAccent, 1.06);
  }

  private get lightBgAccentActive() {
    return lighten(this.lightBgAccentHover, 0.98);
  }

  // used only for generating child colors, not used as a token
  private get lightAccentSubtle() {
    let currentColor = this.seedColor;

    if (this.seedLightness > 100) {
      currentColor = setLch(currentColor, {
        l: 100,
      });
    }

    if (this.seedLightness < 90) {
      currentColor = setLch(currentColor, {
        l: 90,
      });
    }

    if (this.seedChroma > 25) {
      currentColor = setLch(currentColor, {
        c: 25,
      });
    }

    return currentColor;
  }

  private get lightBgAccentSubtleHover() {
    return lighten(this.lightAccentSubtle, 0.98);
  }

  private get lightAccentSubtleActive() {
    return lighten(this.lightAccentSubtle, 1.03);
  }

  private get lightBdAccent() {
    if (contrast(this.seedColor, this.lightBg) >= -15) {
      return setLch(this.seedColor, {
        l: 15,
        c: 8,
      });
    }

    return this.seedColor;
  }

  private get lightFgAccent() {
    if (contrast(this.seedColor, this.lightBg) <= -60) {
      return setLch(this.seedColor, {
        l: 45,
        c: 30,
      });
    }

    if (contrast(this.seedColor, this.lightBg) >= -15) {
      return setLch(this.seedColor, {
        l: 15,
        c: 8,
      });
    }

    return this.seedColor;
  }

  private get lightFgOnAccent() {
    if (contrast(this.seedColor, this.lightBg) <= -60) {
      return setLch(this.seedColor, {
        l: 98.5,
        c: 2,
      });
    }

    return setLch(this.seedColor, {
      l: 15,
      c: 8,
    });
  }

  private get lightBg() {
    return setLch(this.seedColor, {
      l: 98.5,
      c: 2,
    });
  }

  private get lightFg() {
    return setLch(this.seedColor, {
      l: 12,
      c: 4,
    });
  }

  private get lightBdFocus() {
    return defaultTokens.focusColor;
  }

  /*
   * Dark color scheme
   */
  private getDarkColors = () => {
    return {
      bgAccent: this.darkBgAccent,
      bgAccentHover: this.darkBgAccentHover,
      bgAccentActive: this.darkBgAccentActive,
      bgAccentSubtleHover: this.darkBgAccentSubtleHover,
      bgAccentSubtleActive: this.darkAccentSubtleActive,
      bdAccent: this.darkBdAccent,
      fgAccent: this.darkFgAccent,
      fgOnAccent: this.darkFgOnAccent,
      bdFocus: this.darkBdFocus,
      bg: this.darkBg,
      fg: this.darkFg,
    };
  };

  private get darkBgAccent() {
    if (contrast(this.seedColor, this.darkBg) <= -15) {
      return setLch(this.seedColor, {
        l: 79,
        c: 17,
      });
    }

    return this.seedColor;
  }

  private get darkBgAccentHover() {
    return lighten(this.darkBgAccent, 1.04);
  }

  private get darkBgAccentActive() {
    return lighten(this.darkBgAccentHover, 0.94);
  }

  // used only for generating child colors, not used as a token
  private get darkAccentSubtle() {
    let currentColor = this.seedColor;

    if (this.seedLightness > 20) {
      currentColor = setLch(currentColor, {
        l: 20,
      });
    }

    if (this.seedChroma > 14) {
      currentColor = setLch(currentColor, {
        c: 14,
      });
    }

    return currentColor;
  }

  private get darkBgAccentSubtleHover() {
    return lighten(this.darkAccentSubtle, 1.03);
  }

  private get darkAccentSubtleActive() {
    return lighten(this.darkAccentSubtle, 0.98);
  }

  private get darkBdAccent() {
    if (contrast(this.seedColor, this.darkBg) <= 15) {
      return setLch(this.seedColor, {
        l: 98.5,
        c: 2,
      });
    }

    return this.seedColor;
  }

  private get darkFgAccent() {
    if (contrast(this.seedColor, this.darkBg) <= 60) {
      return setLch(this.seedColor, {
        l: 79,
        c: 17,
      });
    }

    return this.seedColor;
  }

  private get darkFgOnAccent() {
    if (contrast(this.seedColor, this.darkBg) <= 40) {
      return setLch(this.seedColor, {
        l: 98.5,
        c: 2,
      });
    }

    return setLch(this.seedColor, {
      l: 15,
      c: 8,
    });
  }

  private get darkBg() {
    return setLch(this.seedColor, {
      l: 15,
      c: 8,
    });
  }

  private get darkFg() {
    return setLch(this.seedColor, {
      l: 96.5,
      c: 3,
    });
  }

  private get darkBdFocus() {
    return defaultTokens.focusColor;
  }
}
