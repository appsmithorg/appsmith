import type { ColorTypes } from "colorjs.io/types/src/color";
import { defaultTokens } from "../../";
import range from "lodash/range";
import kebabCase from "lodash/kebabCase";
import { LightScheme } from "./LightScheme";
import { DarkScheme } from "./DarkScheme";

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
  constructor(
    private color: ColorTypes = defaultTokens.seedColor,
    private colorScheme: ColorScheme = defaultTokens.colorScheme as ColorScheme,
    private rootUnit: number = defaultTokens.rootUnit,
    private borderRadius: TokenObj = defaultTokens.borderRadius,
    private boxShadow: TokenObj = defaultTokens.boxShadow,
    private borderWidth: TokenObj = defaultTokens.borderWidth,
    private opacity: TokenObj = defaultTokens.opacity,
  ) {}

  updateSeedColor = (color: ColorTypes) => {
    this.color = color;
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
        return this.createTokenObject(
          new LightScheme(this.color).getColors(),
          "color",
        );
      case this.isDarkMode:
        return this.createTokenObject(
          new DarkScheme(this.color).getColors(),
          "color",
        );
      default:
        return this.createTokenObject(
          new LightScheme(this.color).getColors(),
          "color",
        );
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
}
