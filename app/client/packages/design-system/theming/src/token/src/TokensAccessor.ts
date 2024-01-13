import kebabCase from "lodash/kebabCase";
import { DarkModeTheme, LightModeTheme } from "../../color";

import type { ColorMode, ColorTypes } from "../../color";
import type {
  ThemeToken,
  TokenObj,
  TokenSource,
  TokenType,
  FontFamily,
  Typography,
} from "./types";

export class TokensAccessor {
  private seedColor?: ColorTypes;
  private colorMode?: ColorMode;
  private borderRadius?: TokenObj;
  private boxShadow?: TokenObj;
  private borderWidth?: TokenObj;
  private opacity?: TokenObj;
  private typography?: Typography;
  private fontFamily?: FontFamily;
  private outerSpacing?: TokenObj;
  private innerSpacing?: TokenObj;
  private sizing?: TokenObj;
  private zIndex?: TokenObj;

  constructor({
    borderRadius,
    borderWidth,
    boxShadow,
    colorMode,
    fontFamily,
    innerSpacing,
    opacity,
    outerSpacing,
    seedColor,
    sizing,
    typography,
    zIndex,
  }: TokenSource) {
    this.seedColor = seedColor;
    this.colorMode = colorMode;
    this.borderRadius = borderRadius;
    this.boxShadow = boxShadow;
    this.borderWidth = borderWidth;
    this.opacity = opacity;
    this.fontFamily = fontFamily;
    this.sizing = sizing;
    this.outerSpacing = outerSpacing;
    this.innerSpacing = innerSpacing;
    this.typography = typography;
    this.zIndex = zIndex;
  }

  updateFontFamily = (fontFamily?: FontFamily) => {
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

  updateZIndex = (zIndex: TokenObj) => {
    this.zIndex = zIndex;
  };

  updateOuterSpacing = (outerSpacing: TokenObj) => {
    this.outerSpacing = outerSpacing;
  };

  updateInnerSpacing = (innerSpacing: TokenObj) => {
    this.innerSpacing = innerSpacing;
  };

  updateSizing = (sizing: TokenObj) => {
    this.sizing = sizing;
  };

  getAllTokens = () => {
    return {
      typography: this.getTypography(),
      fontFamily: this.getFontFamily(),
      ...this.getOuterSpacing(),
      ...this.getInnerSpacing(),
      ...this.getSizing(),
      ...this.getColors(),
      ...this.getBorderRadius(),
      ...this.getBoxShadow(),
      ...this.getBorderWidth(),
      ...this.getOpacity(),
      ...this.getZIndex(),
      colorMode: this.getColorMode(),
    };
  };

  getTypography = () => {
    return this.typography;
  };

  getFontFamily = () => {
    return this.fontFamily;
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

  getOuterSpacing = () => {
    if (this.outerSpacing == null) return {} as ThemeToken;

    return this.createTokenObject(this.outerSpacing, "outerSpacing");
  };

  getInnerSpacing = () => {
    if (this.innerSpacing == null) return {} as ThemeToken;

    return this.createTokenObject(this.innerSpacing, "innerSpacing");
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

  getZIndex = () => {
    if (this.zIndex == null) return {} as ThemeToken;

    return this.createTokenObject(this.zIndex, "zIndex");
  };

  getColorMode = () => {
    return this.colorMode;
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
