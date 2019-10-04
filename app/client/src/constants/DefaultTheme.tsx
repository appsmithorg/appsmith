import * as styledComponents from "styled-components";
import { Colors, Color } from "./Colors";
import * as FontFamilies from "./Fonts";

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
  borders: { thickness: string; style: "dashed" | "solid"; color: Color }[];
};

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20, 50],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30],
  fontWeights: [0, 400, 500, 700],
  colors: {
    primary: Colors.GREEN,
    error: Colors.RED,
    hover: Colors.POLAR,
    textDefault: Colors.BLACK_PEARL,
    textOnDarkBG: Colors.WHITE,
    textAnchor: Colors.PURPLE,
    border: Colors.GEYSER,
    paneCard: Colors.SHARK,
    paneBG: Colors.OUTER_SPACE,
    grid: Colors.GEYSER,
    containerBorder: Colors.FRENCH_PASS,
  },
  lineHeights: [0, 14, 18, 22, 24, 28, 36, 48, 64, 80],
  fonts: [FontFamilies.DMSans, FontFamilies.AppsmithWidget],
  borders: [
    {
      thickness: "1px",
      style: "solid",
      color: Colors.FRENCH_PASS,
    },
  ],
};

export { css, createGlobalStyle, keyframes, ThemeProvider };
export default styled;
