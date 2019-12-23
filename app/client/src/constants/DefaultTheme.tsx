import * as styledComponents from "styled-components";
import { Colors, Color } from "./Colors";
import * as FontFamilies from "./Fonts";
import tinycolor from "tinycolor2";
import _ from "lodash";

export type FontFamily = typeof FontFamilies[keyof typeof FontFamilies];

const {
  default: styled,
  css,
  keyframes,
  createGlobalStyle,
  ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<Theme>;

export const IntentColors: Record<string, Color> = {
  primary: Colors.GREEN,
  success: Colors.PURPLE,
  secondary: Colors.BLACK_PEARL,
  danger: Colors.RED,
  none: Colors.GEYSER_LIGHT,
  warning: Colors.JAFFA,
};

export type Intent = typeof IntentColors[keyof typeof IntentColors];

export const darken = (color: Color, intensity: number) => {
  return new tinycolor(color).darken(intensity).toString();
};

export const darkenHover = (color: Color) => {
  return darken(color, 8);
};

export const darkenActive = (color: Color) => {
  return darken(color, 16);
};

const getHoverAndActiveStyles = (color: Color, filled = true) => {
  return css`
    background: ${color};
    border-color: ${filled ? color : "auto"};
    color: ${filled ? Colors.WHITE : "auto"};
    &:hover {
      background: ${darkenHover(color)};
      border-color: ${darkenHover(color)};
      box-shadow: none;
    }
    &:active {
      background: ${darkenActive(color)};
      border-color: ${darkenActive(color)};
      box-shadow: none;
    }
  `;
};

export const BlueprintButtonIntentsCSS = css`
  &&&.bp3-button {
    box-shadow: none;
    display: flex;
    border-width: 1px;
    border-style: solid;
    outline: none;
    min-width: 100px;
    color: ${IntentColors.secondary};
    border-color: ${IntentColors.none};
    & span.bp3-icon {
      color: ${IntentColors.none};
    }
    background: ${Colors.WHITE};
  }
  &&&.bp3-button.bp3-intent-primary:not(.bp3-minimal) {
    background: ${IntentColors.primary};
    ${getHoverAndActiveStyles(IntentColors.primary)}
  }
  &&&.bp3-button.bp3-intent-secondary:not(.bp3-minimal) {
    background: ${IntentColors.secondary};
    ${getHoverAndActiveStyles(IntentColors.secondary)}
  }
  &&&.bp3-button.bp3-intent-danger:not(.bp3-minimal) {
    background: ${IntentColors.danger};
    ${getHoverAndActiveStyles(IntentColors.danger)}
  }
  &&&.bp3-button.bp3-intent-success:not(.bp3-minimal) {
    background: ${IntentColors.success};
    ${getHoverAndActiveStyles(IntentColors.success)}
  }
  &&&.bp3-button.bp3-intent-warning:not(.bp3-minimal) {
    background: ${IntentColors.warning};
    ${getHoverAndActiveStyles(IntentColors.warning)}
  }

  &&&.bp3-minimal.bp3-button {
    color: ${IntentColors.secondary};
    border: none;
    border-color: ${IntentColors.none};
    & span.bp3-icon {
      color: ${IntentColors.none};
    }
  }
  &&&.bp3-minimal.bp3-intent-primary {
    color: ${IntentColors.primary};
    border-color: ${IntentColors.primary};
  }
  &&&.bp3-minimal.bp3-intent-secondary {
    color: ${IntentColors.secondary};
    border-color: ${IntentColors.secondary};
  }
  &&&.bp3-minimal.bp3-intent-danger {
    color: ${IntentColors.danger};
    border-color: ${IntentColors.danger};
  }
  &&&.bp3-minimal.bp3-intent-warning {
    color: ${IntentColors.warning};
    border-color: ${IntentColors.warning};
  }
  &&&.bp3-minimal.bp3-intent-success {
    color: ${IntentColors.success};
    border-color: ${IntentColors.success};
  }
`;

export type ThemeBorder = {
  thickness: number;
  style: "dashed" | "solid";
  color: Color;
};

type PropertyPaneTheme = {
  width: number;
  height: number;
  dividerColor: Color;
};

export type Theme = {
  radii: Array<number>;
  fontSizes: Array<number>;
  drawerWidth: string;
  spaces: Array<number>;
  fontWeights: Array<number>;
  colors: Record<string, Color>;
  lineHeights: Array<number>;
  fonts: Array<FontFamily>;
  borders: ThemeBorder[];
  propertyPane: PropertyPaneTheme;
  headerHeight: string;
  sidebarWidth: string;
  sideNav: {
    minWidth: number;
    maxWidth: number;
    bgColor: Color;
    fontColor: Color;
    activeItemBGColor: Color;
    navItemHeight: number;
  };
  card: {
    minWidth: number;
    minHeight: number;
    titleHeight: number;
    divider: ThemeBorder;
    hoverBG: Color;
    hoverBGOpacity: number;
  };
  authCard: {
    width: number;
    borderRadius: number;
    background: Color;
    padding: number;
    dividerSpacing: number;
    shadow: string;
  };
  shadows: string[];
  widgets: {
    tableWidget: {
      selectHighlightColor: Color;
    };
  };
  pageContentWidth: number;
};

export const getColorWithOpacity = (color: Color, opacity: number) => {
  color = color.slice(1);
  const val = parseInt(color, 16);
  const r = (val >> 16) & 255;
  const g = (val >> 8) & 255;
  const b = val & 255;
  return `rgba(${r},${g},${b},${opacity})`;
};

export const getBorderCSSShorthand = (border?: ThemeBorder): string => {
  const values: string[] = [];
  _.forIn(border, (value, key) => {
    values.push(key === "thickness" ? value + "px" : value);
  });
  return values.join(" ");
};

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20, 50],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36],
  fontWeights: [0, 400, 500, 700],
  propertyPane: {
    width: 250,
    height: 600,
    dividerColor: Colors.MAKO,
  },
  drawerWidth: "80%",
  colors: {
    primary: Colors.GREEN,
    primaryDarker: Colors.JUNGLE_GREEN,
    primaryDarkest: Colors.JUNGLE_GREEN_DARKER,
    secondary: Colors.GEYSER_LIGHT,
    secondaryDarker: Colors.CONCRETE,
    secondaryDarkest: Colors.MERCURY,
    error: Colors.RED,
    info: Colors.SLATE_GRAY,
    hover: Colors.POLAR,
    inputInactiveBorders: Colors.MYSTIC,
    inputInactiveBG: Colors.AQUA_HAZE,
    textDefault: Colors.BLACK_PEARL,
    textOnDarkBG: Colors.WHITE,
    textAnchor: Colors.PURPLE,
    border: Colors.GEYSER,
    paneCard: Colors.SHARK,
    paneInputBG: Colors.SHARK,
    paneBG: Colors.OUTER_SPACE,
    paneText: Colors.GRAY_CHATEAU,
    paneSectionLabel: Colors.CADET_BLUE,
    navBG: Colors.SHARK,
    grid: Colors.GEYSER,
    containerBorder: Colors.FRENCH_PASS,
    menuButtonBGInactive: Colors.JUNGLE_MIST,
    menuIconColorInactive: Colors.OXFORD_BLUE,
    bodyBG: Colors.ATHENS_GRAY,
    builderBodyBG: Colors.WHITE,
    widgetName: Colors.BLUE_BAYOUX,
  },
  lineHeights: [0, 14, 18, 22, 24, 28, 36, 48, 64, 80],
  fonts: [
    FontFamilies.DMSans,
    FontFamilies.AppsmithWidget,
    FontFamilies.FiraCode,
  ],
  borders: [
    {
      thickness: 1,
      style: "dashed",
      color: Colors.FRENCH_PASS,
    },
    {
      thickness: 2,
      style: "solid",
      color: Colors.FRENCH_PASS,
    },
    {
      thickness: 1,
      style: "solid",
      color: Colors.GEYSER_LIGHT,
    },
    {
      thickness: 1,
      style: "solid",
      color: Colors.FRENCH_PASS,
    },
  ],
  sidebarWidth: "300px",
  headerHeight: "50px",
  sideNav: {
    maxWidth: 250,
    minWidth: 50,
    bgColor: Colors.OXFORD_BLUE,
    fontColor: Colors.WHITE,
    activeItemBGColor: Colors.SHARK,
    navItemHeight: 42,
  },
  card: {
    minWidth: 282,
    minHeight: 220,
    titleHeight: 48,
    divider: {
      thickness: 1,
      style: "solid",
      color: Colors.GEYSER_LIGHT,
    },
    hoverBG: Colors.BLACK,
    hoverBGOpacity: 0.5,
  },
  authCard: {
    width: 612,
    borderRadius: 16,
    background: Colors.WHITE,
    padding: 40,
    dividerSpacing: 32,
    shadow: "0px 4px 8px rgba(9, 30, 66, 0.25)",
  },
  shadows: ["0px 2px 4px rgba(67, 70, 74, 0.14)"],
  widgets: {
    tableWidget: {
      selectHighlightColor: Colors.GEYSER_LIGHT,
    },
  },
  pageContentWidth: 1224,
};

export { css, createGlobalStyle, keyframes, ThemeProvider };
export default styled;
