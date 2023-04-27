import range from "lodash/range";
import kebabCase from "lodash/kebabCase";
import { DarkModeTheme } from "./DarkModeTheme";
import { LightModeTheme } from "./LightModeTheme";

import type {
  ColorMode,
  TokenObj,
  TokenSource,
  ThemeTokens,
  TokenType,
  ColorTypes,
} from "./types";

export class TokensAccessor {
  private seedColor?: ColorTypes;
  private colorMode?: ColorMode;
  private borderRadius?: TokenObj;
  private rootUnit?: number;
  private boxShadow?: TokenObj;
  private borderWidth?: TokenObj;
  private opacity?: TokenObj;

  constructor({
    borderRadius,
    borderWidth,
    boxShadow,
    colorMode,
    opacity,
    rootUnit,
    seedColor,
  }: TokenSource) {
    this.seedColor = seedColor;
    this.colorMode = colorMode;
    this.rootUnit = rootUnit;
    this.borderRadius = borderRadius;
    this.boxShadow = boxShadow;
    this.borderWidth = borderWidth;
    this.opacity = opacity;
  }

  updateSeedColor = (color: ColorTypes) => {
    this.seedColor = color;
  };

  updateColorMode = (colorMode: ColorMode) => {
    this.colorMode = colorMode;
  };

  updateBorderRadius = (borderRadius: TokenObj) => {
    this.borderRadius = borderRadius;
  };

  updateRootUnit = (rootUnit: number) => {
    this.rootUnit = rootUnit;
  };

  updateBoxShadow = (boxShadow: TokenObj) => {
    this.boxShadow = boxShadow;
  };

  updateBorderWidth = (borderWidth: TokenObj) => {
    this.borderWidth = borderWidth;
  };

  updateOpacity = (opacity: TokenObj) => {
    this.opacity = opacity;
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
    if (this.seedColor == null) return {} as ThemeTokens;

    switch (true) {
      case this.isLightMode:
        return this.createTokenObject(
          new LightModeTheme(this.seedColor).getColors(),
          "color",
        );
      case this.isDarkMode:
        return this.createTokenObject(
          new DarkModeTheme(this.seedColor).getColors(),
          "color",
        );
      default:
        return this.createTokenObject(
          new LightModeTheme(this.seedColor).getColors(),
          "color",
        );
    }
  };

  getSizing = () => {
    if (this.rootUnit == null) return {} as ThemeTokens;

    const sizing = {
      rootUnit: `${this.rootUnit}px`,
    };

    return this.createTokenObject(sizing, "sizing");
  };

  getSpacing = (count = 6) => {
    if (this.rootUnit == null) return {} as ThemeTokens;

    const spacing = range(count).reduce((acc, value, index) => {
      return {
        ...acc,
        [index]: `${(this.rootUnit as number) * value}px`,
      };
    }, {});

    return this.createTokenObject(spacing, "spacing");
  };

  getBorderRadius = () => {
    if (this.borderRadius == null) return {} as ThemeTokens;

    return this.createTokenObject(this.borderRadius, "borderRadius");
  };

  getBoxShadow = () => {
    if (this.boxShadow == null) return {} as ThemeTokens;

    return this.createTokenObject(this.boxShadow, "boxShadow");
  };

  getBorderWidth = () => {
    if (this.borderWidth == null) return {} as ThemeTokens;

    return this.createTokenObject(this.borderWidth, "borderWidth");
  };

  getOpacity = () => {
    if (this.opacity == null) return {} as ThemeTokens;

    return this.createTokenObject(this.opacity, "opacity");
  };

  private get isLightMode() {
    return this.colorMode === "light";
  }

  private get isDarkMode() {
    return this.colorMode === "dark";
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
