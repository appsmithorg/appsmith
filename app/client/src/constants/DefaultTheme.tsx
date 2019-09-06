import * as styledComponents from "styled-components";
import * as Colors from "./Colors";
import * as FontFamilies from "./Fonts";

export type Color = (typeof Colors)[keyof typeof Colors];
export type FontFamily = (typeof FontFamilies)[keyof typeof FontFamilies];

const {
  default: styled,
  css,
  keyframes,
  createGlobalStyle,
  ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<Theme>;

export type Theme = {
  radii: Array<number>;
  fontSizes: Array<number>;
  spaces: Array<number>;
  fontWeights: Array<number>;
  colors: Record<string, Color>;
  lineHeights: Array<number>;
  fonts: Array<FontFamily>;
};

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
  fontWeights: [0, 400, 500, 700],
  colors: {
    primary: Colors.GREEN,
    error: Colors.RED,
    hover: Colors.WHITE_1,
    textDefault: Colors.BLACK_1,
    textOnDarkBG: Colors.WHITE,
    textAnchor: Colors.PURPLE ,
    border: Colors.WHITE_2 ,
    paneCard: Colors.BLACK_2,
    paneBG: Colors.BLACK_4,
  },
  lineHeights: [0, 14, 18, 22, 24, 28, 36, 48, 64, 80],
  fonts: [FontFamilies.DMSans, FontFamilies.AppsmithWidget],
};

export { css, createGlobalStyle, keyframes, ThemeProvider };
export default styled;
