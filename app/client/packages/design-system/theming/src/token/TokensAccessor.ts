import kebabCase from "lodash/kebabCase";
import { DarkModeTheme, LightModeTheme } from "../color";
import { createTypographyStringMap } from "../typography";

import type { ColorMode, ColorTypes } from "../color";
import type { FontFamily, Typography } from "../typography";
import type {
  RootUnit,
  ThemeToken,
  TokenObj,
  TokenSource,
  TokenType,
} from "./types";

export class TokensAccessor {
  private seedColor?: ColorTypes;
  private colorMode?: ColorMode;
  private borderRadius?: TokenObj;
  private rootUnit?: RootUnit;
  private boxShadow?: TokenObj;
  private borderWidth?: TokenObj;
  private opacity?: TokenObj;
  private typography?: Typography;
  private fontFamily?: FontFamily;
  private spacing?: TokenObj;
  private sizing?: TokenObj;

  constructor({
    borderRadius,
    borderWidth,
    boxShadow,
    colorMode,
    fontFamily,
    opacity,
    rootUnit,
    seedColor,
    sizing,
    spacing,
    typography,
  }: TokenSource) {
    this.seedColor = seedColor;
    this.colorMode = colorMode;
    this.rootUnit = rootUnit;
    this.borderRadius = borderRadius;
    this.boxShadow = boxShadow;
    this.borderWidth = borderWidth;
    this.opacity = opacity;
    this.fontFamily = fontFamily;
    this.sizing = sizing;
    this.spacing = spacing;
    this.typography = typography;
  }

  updateRootUnit = (rootUnit: RootUnit) => {
    this.rootUnit = rootUnit;
  };

  updateFontFamily = (fontFamily: FontFamily) => {
    this.fontFamily = fontFamily;
  };

  updateTypography = (typography: Typography) => {
    this.typography = typography;
  };

  updateSeedColor = (color: ColorTypes) => {
    this.seedColor = color;
  };

  updateColorMode = (colorMode: ColorMode) => {
    this.colorMode = colorMode;
  };

  updateBorderRadius = (borderRadius: TokenObj) => {
    this.borderRadius = borderRadius;
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

  updateSpacing = (spacing: TokenObj) => {
    this.spacing = spacing;
  };

  updateSizing = (sizing: TokenObj) => {
    this.sizing = sizing;
  };

  getAllTokens = () => {
    return {
      rootUnit: this.getRootUnit(),
      typography: this.getTypography(),
      ...this.getSpacing(),
      ...this.getSizing(),
      ...this.getSizing(),
      ...this.getColors(),
      ...this.getBorderRadius(),
      ...this.getBoxShadow(),
      ...this.getBorderWidth(),
      ...this.getOpacity(),
    };
  };

  getRootUnit = () => {
    return this.rootUnit;
  };

  getTypography = (): string | undefined => {
    if (this.typography) {
      return createTypographyStringMap(this.typography);
    }
  };

  getColors = () => {
    if (this.seedColor == null) return {} as ThemeToken;

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

  getSpacing = () => {
    if (this.spacing == null) return {} as ThemeToken;

    return this.createTokenObject(this.spacing, "spacing");
  };

  getSizing = () => {
    if (this.sizing == null) return {} as ThemeToken;

    return this.createTokenObject(this.sizing, "sizing");
  };

  getBorderRadius = () => {
    if (this.borderRadius == null) return {} as ThemeToken;

    return this.createTokenObject(this.borderRadius, "borderRadius");
  };

  getBoxShadow = () => {
    if (this.boxShadow == null) return {} as ThemeToken;

    return this.createTokenObject(this.boxShadow, "boxShadow");
  };

  getBorderWidth = () => {
    if (this.borderWidth == null) return {} as ThemeToken;

    return this.createTokenObject(this.borderWidth, "borderWidth");
  };

  getOpacity = () => {
    if (this.opacity == null) return {} as ThemeToken;

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
  ): ThemeToken => {
    const themeTokens = {} as ThemeToken;

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
