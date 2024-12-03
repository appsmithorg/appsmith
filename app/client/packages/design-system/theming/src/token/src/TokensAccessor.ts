import kebabCase from "lodash/kebabCase";
import { DarkModeTheme, LightModeTheme } from "../../color";

import type { ColorMode, ColorTypes } from "../../color";
import type {
  ThemeToken,
  TokenObj,
  TokenSource,
  TokenType,
  Typography,
  FontFamily,
} from "./types";

export class TokensAccessor {
  private seedColor?: ColorTypes;
  private colorMode?: ColorMode;
  private borderRadiusElevation?: TokenObj;
  private boxShadow?: TokenObj;
  private borderWidth?: TokenObj;
  private opacity?: TokenObj;
  private typography?: Typography;
  private outerSpacing?: TokenObj;
  private innerSpacing?: TokenObj;
  private sizing?: TokenObj;
  private zIndex?: TokenObj;
  private strokeWidth?: TokenObj;
  private iconSize?: TokenObj;
  private fontFamily?: FontFamily;

  constructor({
    borderRadiusElevation,
    borderWidth,
    boxShadow,
    colorMode,
    iconSize,
    innerSpacing,
    opacity,
    outerSpacing,
    seedColor,
    sizing,
    strokeWidth,
    typography,
    zIndex,
    fontFamily,
  }: TokenSource) {
    this.seedColor = seedColor;
    this.colorMode = colorMode;
    this.borderRadiusElevation = borderRadiusElevation;
    this.boxShadow = boxShadow;
    this.borderWidth = borderWidth;
    this.opacity = opacity;
    this.sizing = sizing;
    this.outerSpacing = outerSpacing;
    this.innerSpacing = innerSpacing;
    this.typography = typography;
    this.zIndex = zIndex;
    this.strokeWidth = strokeWidth;
    this.iconSize = iconSize;
    this.fontFamily = fontFamily;
  }

  updateTypography = (typography: Typography) => {
    this.typography = typography;
  };


  updateFontFamily = (fontFamily?: FontFamily) => {
    this.fontFamily = fontFamily;
  };
  

  updateSeedColor = (color: ColorTypes) => {
    this.seedColor = color;
  };

  updateColorMode = (colorMode: ColorMode) => {
    this.colorMode = colorMode;
  };

  updateBorderRadiusElevation = (borderRadiusElevation: TokenObj) => {
    // when the border-radius base is 0px, we set all other border-radius to 0px
    if (borderRadiusElevation["base"] == "0px") {
      Object.keys(borderRadiusElevation).forEach((key) => {
        if (key !== "base") {
          borderRadiusElevation[key] = "0px";
        }
      });
    }

    this.borderRadiusElevation = borderRadiusElevation;
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

  updateStrokeWidth = (strokeWidth: TokenObj) => {
    this.strokeWidth = strokeWidth;
  };

  updateIconSize = (iconSize: TokenObj) => {
    this.iconSize = iconSize;
  };

  getAllTokens = () => {
    return {
      typography: this.getTypography(),
      ...this.getOuterSpacing(),
      ...this.getInnerSpacing(),
      ...this.getSizing(),
      ...this.getColors(),
      ...this.getBorderRadiusElevation(),
      ...this.getBoxShadow(),
      ...this.getBorderWidth(),
      ...this.getOpacity(),
      ...this.getZIndex(),
      ...this.getStrokeWidth(),
      ...this.getIconSize(),
      colorMode: this.getColorMode(),
      fontFamily: this.getFontFamily(),
    };
  };

  getFontFamily = () => {
    return this.fontFamily;
  };

  getTypography = () => {
    return this.typography;
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

  getBorderRadiusElevation = () => {
    if (this.borderRadiusElevation == null) return {} as ThemeToken;

    return this.createTokenObject(
      this.borderRadiusElevation,
      "borderRadiusElevation",
    );
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

  getStrokeWidth = () => {
    if (this.strokeWidth == null) return {} as ThemeToken;

    return this.createTokenObject(this.strokeWidth, "strokeWidth");
  };

  getIconSize = () => {
    if (this.iconSize == null) return {} as ThemeToken;

    return this.createTokenObject(this.iconSize, "iconSize");
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
