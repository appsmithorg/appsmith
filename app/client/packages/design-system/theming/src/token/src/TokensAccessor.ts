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
  IconStyle,
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
  private iconStyle?: IconStyle;
  private strokeWidth?: TokenObj;
  private iconSize?: TokenObj;

  constructor({
    borderRadius,
    borderWidth,
    boxShadow,
    colorMode,
    fontFamily,
    iconSize,
    iconStyle,
    innerSpacing,
    opacity,
    outerSpacing,
    seedColor,
    sizing,
    strokeWidth,
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
    this.iconStyle = iconStyle;
    this.strokeWidth = strokeWidth;
    this.iconSize = iconSize;
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
    // when the border-radius base is 0px, we set all other border-radius to 0px
    if (borderRadius["base"] == "0px") {
      Object.keys(borderRadius).forEach((key) => {
        if (key !== "base") {
          borderRadius[key] = "0px";
        }
      });
    }

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

  updateIconStyle = (iconStyle: IconStyle) => {
    this.iconStyle = iconStyle;
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
      ...this.getStrokeWidth(),
      ...this.getIconSize(),
      colorMode: this.getColorMode(),
      iconStyle: this.getIconStyle(),
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

  getIconStyle = () => {
    return this.iconStyle;
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
