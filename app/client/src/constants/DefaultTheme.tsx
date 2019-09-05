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
  radii: [],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 32, 48, 64],
  spaces: [0, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
  fontWeights: [0, 400, 500, 700],
  colors: {
    primary: Colors.GREEN,
    error: Colors.RED,
    hover: Colors.WHITE_1,
    textDefault: Colors.BLACK_1,
    textAnchor: Colors.PURPLE ,
    border: Colors.WHITE_2 ,
    paneCard: Colors.BLACK_3,
    paneBG: Colors.BLACK_2,
  },
  lineHeights: [0, 14, 18, 22, 24, 28, 36, 48, 64, 80],
  fonts: [FontFamilies.DMSans as FontFamily],
};

export { css, createGlobalStyle, keyframes, ThemeProvider };
export default styled;
