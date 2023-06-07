import kebabCase from "lodash/kebabCase";
import range from "lodash/range";
import type { ColorMode, ColorTypes } from "../color";
import { DarkModeTheme, LightModeTheme } from "../color";
import type { FontFamily, Typography, TypographySource } from "../typography";

import type { ThemeToken, TokenObj, TokenSource, TokenType } from "./types";

export class TokensAccessor {
  private seedColor?: ColorTypes;
  private colorMode?: ColorMode;
  private borderRadius?: TokenObj;
  private rootUnit: number;
  private boxShadow?: TokenObj;
  private borderWidth?: TokenObj;
  private opacity?: TokenObj;
  private typography: TypographySource;
  private fontFamily?: FontFamily;

  constructor({
    borderRadius,
    borderWidth,
    boxShadow,
    colorMode,
    fontFamily,
    opacity,
    rootUnit,
    seedColor,
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
    this.typography = typography;
  }

  updateRootUnit = (rootUnit: number) => {
    this.rootUnit = rootUnit;
  };

  updateFontFamily = (fontFamily: FontFamily) => {
    this.fontFamily = fontFamily;
  };

  updateTypography = (typography: TypographySource) => {
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

  getAllTokens = () => {
    return {
      rootUnit: this.getRootUnit(),
      ...this.getTypography(),
      ...this.getColors(),
      ...this.getSpacing(),
      ...this.getBorderRadius(),
      ...this.getBoxShadow(),
      ...this.getBorderWidth(),
      ...this.getOpacity(),
    };
  };

  getRootUnit = () => {
    return this.rootUnit;
  };

  getTypography = (): { typography: Typography } => {
    const keys = Object.keys(this.typography) as Array<keyof TypographySource>;

    return {
      typography: keys.reduce((prev, current) => {
        return {
          ...prev,
          [current]: {
            capHeight: this.typography[current].capHeightRatio * this.rootUnit,
            lineGap: this.typography[current].lineGapRatio * this.rootUnit,
            fontFamily: this.typography[current].fontFamily ?? this.fontFamily,
          },
        };
      }, {} as Typography),
    };
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

  getSpacing = (count = 6) => {
    if (this.rootUnit == null) return {} as ThemeToken;

    const spacing = range(count).reduce((acc, value, index) => {
      return {
        ...acc,
        [index]: `${(this.rootUnit as number) * value}px`,
      };
    }, {});

    return this.createTokenObject(spacing, "spacing");
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
