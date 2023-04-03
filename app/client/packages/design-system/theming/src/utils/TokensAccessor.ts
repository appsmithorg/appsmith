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

type Token = {
  value: string | number;
  type: TokenType;
};

type ThemeTokens = {
  [key in TokenType]: { [key: string]: Token };
};

type TokenObj = { [key: string]: string | number };

export class TokensAccessor {
  constructor(
    private color: ColorTypes = defaultTokens.seedColor,
    private rootUnit: number = defaultTokens.rootUnit,
    private borderRadius: TokenObj = defaultTokens.borderRadius,
    private boxShadow: TokenObj = defaultTokens.boxShadow,
    private borderWidth: TokenObj = defaultTokens.borderWidth,
    private opacity: TokenObj = defaultTokens.opacity,
    private colorsAccessor: ColorsAccessor = new ColorsAccessor(color),
  ) {}

  updateSeedColor = (color: ColorTypes) => {
    this.colorsAccessor.updateColor(color);
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
    return this.colorsAccessor.getHex();
  };

  private getBgAccentHover = () => {
    return this.colorsAccessor.lighten(this.getBgAccent());
  };

  private getBgAccentActive = () => {
    return this.colorsAccessor.lighten(this.getBgAccentHover());
  };

  private getBgAccentSubtleHover = () => {
    return this.colorsAccessor.lighten(this.getBgAccent(), 0.3);
  };

  private getAccentSubtleActive = () => {
    return this.colorsAccessor.lighten(this.getBgAccentSubtleHover());
  };

  private getBdAccent = () => {
    return this.colorsAccessor.getHex();
  };

  private getFgAccent = () => {
    return this.colorsAccessor.getHex();
  };

  private getFgOnAccent = () => {
    return this.colorsAccessor.getComplementaryGrayscale();
  };

  private getBdFocus = () => {
    return this.colorsAccessor.getFocus();
  };
}
