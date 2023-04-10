import { ColorsAccessor } from "../utils/ColorsAccessor";
import type { ColorTypes } from "colorjs.io/types/src/color";
import defaultTokens from "../tokens/defaultTokens.json";
import range from "lodash/range";
import kebabCase from "lodash/kebabCase";

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
  private accentColor;

  constructor(
    private color: ColorTypes = defaultTokens.seedColor,
    private colorScheme: ColorScheme = defaultTokens.colorScheme as ColorScheme,
    private rootUnit: number = defaultTokens.rootUnit,
    private borderRadius: TokenObj = defaultTokens.borderRadius,
    private boxShadow: TokenObj = defaultTokens.boxShadow,
    private borderWidth: TokenObj = defaultTokens.borderWidth,
    private opacity: TokenObj = defaultTokens.opacity,
    private colorsAccessor: ColorsAccessor = new ColorsAccessor(color),
  ) {
    this.accentColor = this.colorsAccessor.getHex();
  }

  updateSeedColor = (color: ColorTypes) => {
    this.accentColor = this.colorsAccessor.updateColor(color).getHex();
  };

  updateColorScheme = (colorScheme: ColorScheme) => {
    this.colorScheme = colorScheme;
  };

  updateBorderRadius = (borderRadius: TokenObj) => {
    this.borderRadius = borderRadius;
    this.createTokenObject(this.borderRadius, "borderRadius");
  };

  getColors = () => {
    const colors = {
      bgAccent: this.getBgAccent(),
      bgAccentHover: this.getBgAccentHover(),
      bgAccentActive: this.getBgAccentActive(),
      bgAccentSubtleHover: this.getBgAccentSubtleHover(),
      bgAccentSubtleActive: this.getAccentSubtleActive(),
      bdAccent: this.getBdAccent(),
      fgAccent: this.getFgAccent(),
      fgOnAccent: this.getFgOnAccent(),
      bdFocus: this.getBdFocus(),
      bg: this.getBg(),
      fg: this.getFg(),
    };

    return this.createTokenObject(colors, "color");
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

  private getBgAccent = () => {
    if (this.isLightMode) {
      if (
        this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= -60
      ) {
        return this.colorsAccessor.setColor(this.accentColor, {
          l: 45,
          c: 30,
        });
      }

      if (
        this.colorsAccessor.getContrast(this.accentColor, this.getBg()) >= -15
      ) {
        return this.colorsAccessor.setColor(this.accentColor, {
          l: 85,
        });
      }

      return this.accentColor;
    }

    if (this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= 60) {
      return this.colorsAccessor.setColor(this.accentColor, {
        l: 79,
        c: 17,
      });
    }

    return this.accentColor;
  };

  private getBgAccentHover = () => {
    if (this.isLightMode) {
      this.colorsAccessor.lighten(this.getBgAccent(), 1.06);
    }

    return this.colorsAccessor.lighten(this.getBgAccent(), 1.04);
  };

  private getBgAccentActive = () => {
    if (this.isLightMode) {
      return this.colorsAccessor.lighten(this.getBgAccentHover(), 0.98);
    }

    return this.colorsAccessor.lighten(this.getBgAccentHover(), 0.94);
  };

  private getAccentSubtle = () => {
    let currentColor = this.accentColor;

    if (this.isLightMode) {
      if (this.colorsAccessor.getLightness() > 100) {
        currentColor = this.colorsAccessor.setColor(currentColor, {
          l: 100,
        });
      }

      if (this.colorsAccessor.getLightness() < 90) {
        currentColor = this.colorsAccessor.setColor(currentColor, {
          l: 90,
        });
      }

      if (this.colorsAccessor.getChroma() > 20) {
        currentColor = this.colorsAccessor.setColor(currentColor, {
          c: 14,
        });
      }

      return currentColor;
    }

    if (this.colorsAccessor.getLightness() > 20) {
      currentColor = this.colorsAccessor.setColor(currentColor, {
        l: 20,
      });
    }

    if (this.colorsAccessor.getChroma() > 14) {
      currentColor = this.colorsAccessor.setColor(currentColor, {
        c: 14,
      });
    }

    return currentColor;
  };

  private getBgAccentSubtleHover = () => {
    if (this.isLightMode) {
      this.colorsAccessor.lighten(this.getAccentSubtle(), 0.98);
    }

    return this.colorsAccessor.lighten(this.getAccentSubtle(), 1.03);
  };

  private getAccentSubtleActive = () => {
    if (this.isLightMode) {
      this.colorsAccessor.lighten(this.getAccentSubtle(), 1.03);
    }

    return this.colorsAccessor.lighten(this.getAccentSubtle(), 0.98);
  };

  private getBdAccent = () => {
    if (this.isLightMode) {
      if (
        this.colorsAccessor.getContrast(this.accentColor, this.getBg()) >= -15
      ) {
        return this.colorsAccessor.setColor(this.accentColor, {
          l: 15,
          c: 8,
        });
      }

      return this.accentColor;
    }

    if (this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= 15) {
      return this.colorsAccessor.setColor(this.accentColor, {
        l: 98.5,
        c: 2,
      });
    }

    return this.accentColor;
  };

  private getFgAccent = () => {
    if (this.isLightMode) {
      if (
        this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= -60
      ) {
        return this.colorsAccessor.setColor(this.accentColor, {
          l: 45,
          c: 30,
        });
      }

      if (
        this.colorsAccessor.getContrast(this.accentColor, this.getBg()) >= -15
      ) {
        return this.colorsAccessor.setColor(this.accentColor, {
          l: 15,
          c: 8,
        });
      }

      return this.accentColor;
    }

    if (this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= 60) {
      return this.colorsAccessor.setColor(this.accentColor, {
        l: 79,
        c: 17,
      });
    }

    return this.accentColor;
  };

  private getFgOnAccent = () => {
    if (this.isLightMode) {
      if (
        this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= -60
      ) {
        return this.colorsAccessor.setColor(this.accentColor, {
          l: 98.5,
          c: 2,
        });
      }

      return this.colorsAccessor.setColor(this.accentColor, {
        l: 15,
        c: 8,
      });
    }

    if (this.colorsAccessor.getContrast(this.accentColor, this.getBg()) <= 40) {
      return this.colorsAccessor.setColor(this.accentColor, {
        l: 98.5,
        c: 2,
      });
    }

    return this.colorsAccessor.setColor(this.accentColor, {
      l: 15,
      c: 8,
    });
  };

  private getBdFocus = () => {
    return defaultTokens.focusColor;
  };

  private getBg = () => {
    if (this.isLightMode) {
      return this.colorsAccessor.setColor(this.accentColor, {
        l: 98.5,
        c: 2,
      });
    }

    return this.colorsAccessor.setColor(this.accentColor, {
      l: 15,
      c: 8,
    });
  };

  private getFg = () => {
    if (this.isLightMode) {
      return this.colorsAccessor.setColor(this.accentColor, {
        l: 12,
        c: 4,
      });
    }

    return this.colorsAccessor.setColor(this.accentColor, {
      l: 96.5,
      c: 3,
    });
  };

  private get isLightMode() {
    return this.colorScheme === "light";
  }
}
