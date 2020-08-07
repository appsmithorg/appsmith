import * as styledComponents from "styled-components";
import { Colors, Color } from "./Colors";
import * as FontFamilies from "./Fonts";
import tinycolor from "tinycolor2";
import _ from "lodash";
import { Classes } from "@blueprintjs/core";
import { AlertIcons } from "icons/AlertIcons";
import { IconProps } from "constants/IconConstants";
import { JSXElementConstructor } from "react";
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

export const IntentIcons: Record<Intent, JSXElementConstructor<IconProps>> = {
  primary: AlertIcons.SUCCESS,
  success: AlertIcons.SUCCESS,
  secondary: AlertIcons.INFO,
  danger: AlertIcons.ERROR,
  none: AlertIcons.INFO,
  warning: AlertIcons.WARNING,
};

export enum Skin {
  LIGHT,
  DARK,
}

export const BlueprintControlTransform = css`
  && {
    .${Classes.CONTROL} {
      & input:checked ~ .${Classes.CONTROL_INDICATOR} {
        background: ${props => props.theme.colors.primaryOld};
        box-shadow: none;
        border: 2px solid ${props => props.theme.colors.primaryOld};
      }
      & input:not(:disabled):active ~ .${Classes.CONTROL_INDICATOR} {
        box-shadow: none;
        background: none;
        border: 2px solid ${Colors.SLATE_GRAY};
      }
      & input:not(:disabled):active:checked ~ .${Classes.CONTROL_INDICATOR} {
        box-shadow: none;
        background: none;
        border: 2px solid ${Colors.SLATE_GRAY};
      }
      &:hover .${Classes.CONTROL_INDICATOR} {
        box-shadow: none;
        background: none;
        border: 2px solid ${Colors.SLATE_GRAY};
      }
    }
    .${Classes.CONTROL_INDICATOR} {
      box-shadow: none;
      background: none;
      border: 2px solid ${Colors.SLATE_GRAY};
      &::before {
        position: absolute;
        left: -2px;
        top: -2px;
      }
    }
  }
`;

export const invisible = css`
  && > * {
    opacity: 0.6;
  }
`;

export const BlueprintCSSTransform = css`
  &&&& {
    .${Classes.BUTTON} {
      box-shadow: none;
      border-radius: 4px;
      background: white;
      border: 1px solid ${Colors.GEYSER};
    }
    .${Classes.INTENT_PRIMARY} {
      background: ${IntentColors.primary};
    }
    .${Classes.INTENT_SUCCESS} {
      background: ${IntentColors.success};
    }
    .${Classes.INTENT_DANGER} {
      background: ${IntentColors.danger};
    }
    .${Classes.INTENT_WARNING} {
      background: ${IntentColors.warning};
    }
  }
`;

export const darken = (color: Color, intensity: number) => {
  return new tinycolor(color).darken(intensity).toString();
};

export const darkenHover = (color: Color) => {
  return darken(color, 8);
};

export const darkenActive = (color: Color) => {
  return darken(color, 16);
};

const getButtonHoverAndActiveStyles = (color: Color, filled = true) => {
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
  &&.${Classes.BUTTON} {
    box-shadow: none;
    display: flex;
    border-width: 1px;
    border-style: solid;
    outline: none;
    min-width: 50px;
    color: ${IntentColors.secondary};
    border-color: ${IntentColors.none};
    & span.bp3-icon {
      color: ${IntentColors.none};
    }
    & span {
      font-weight: ${props => props.theme.fontWeights[3]};
    }
    background: ${Colors.WHITE};
  }
  &&&.${Classes.BUTTON}.${Classes.INTENT_PRIMARY}:not(.${Classes.MINIMAL}) {
    background: ${IntentColors.primary};
    ${getButtonHoverAndActiveStyles(IntentColors.primary)}
  }
  &&&.${Classes.BUTTON}.bp3-intent-secondary:not(.${Classes.MINIMAL}) {
    background: ${IntentColors.secondary};
    ${getButtonHoverAndActiveStyles(IntentColors.secondary)}
  }
  &&&.${Classes.BUTTON}.${Classes.INTENT_DANGER}:not(.${Classes.MINIMAL}) {
    background: ${IntentColors.danger};
    ${getButtonHoverAndActiveStyles(IntentColors.danger)}
  }
  &&&.${Classes.BUTTON}.${Classes.INTENT_SUCCESS}:not(.${Classes.MINIMAL}) {
    background: ${IntentColors.success};
    ${getButtonHoverAndActiveStyles(IntentColors.success)}
  }
  &&&.${Classes.BUTTON}.${Classes.INTENT_WARNING}:not(.${Classes.MINIMAL}) {
    background: ${IntentColors.warning};
    ${getButtonHoverAndActiveStyles(IntentColors.warning)}
  }

  &&.${Classes.MINIMAL}.${Classes.BUTTON} {
    border: none;
    border-color: ${IntentColors.none};
    & span.bp3-icon {
      color: ${IntentColors.none};
    }
  }
  &&&.${Classes.MINIMAL}.${Classes.INTENT_PRIMARY} {
    color: ${IntentColors.primary};
    border-color: ${IntentColors.primary};
  }
  &&&.${Classes.MINIMAL}.bp3-intent-secondary {
    color: ${IntentColors.secondary};
    border-color: ${IntentColors.secondary};
  }
  &&&.${Classes.MINIMAL}.${Classes.INTENT_DANGER} {
    color: ${IntentColors.danger};
    border-color: ${IntentColors.danger};
  }
  &&&.${Classes.MINIMAL}.${Classes.INTENT_WARNING} {
    color: ${IntentColors.warning};
    border-color: ${IntentColors.warning};
  }
  &&&.${Classes.MINIMAL}.${Classes.INTENT_SUCCESS} {
    color: ${IntentColors.success};
    border-color: ${IntentColors.success};
  }

  &&&&&&.${Classes.DISABLED} {
    color: ${Colors.SLATE_GRAY};
    background: ${Colors.MERCURY};
    border-color: ${Colors.MERCURY};
  }
`;

export const BlueprintInputTransform = css`
  && {
    .${Classes.INPUT} {
      border-radius: ${props => props.theme.radii[1]}px;
      box-shadow: none;
      border: ${props => getBorderCSSShorthand(props.theme.borders[2])};
      &:focus {
        border: ${props => getBorderCSSShorthand(props.theme.borders[2])};
        box-shadow: none;
      }
    }
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

export type NestedObjectOrArray<T> =
  | Record<string, T | T[] | Record<string, T | T[]>>
  | T
  | T[];
export type Theme = {
  radii: Array<number>;
  fontSizes: Array<number>;
  drawerWidth: string;
  spaces: Array<number>;
  fontWeights: Array<number>;
  colors: any;
  typography: any;
  lineHeights: Array<number>;
  fonts: Array<FontFamily>;
  borders: ThemeBorder[];
  evaluatedValuePopup: {
    width: number;
    height: number;
  };
  propertyPane: PropertyPaneTheme;
  headerHeight: string;
  sidebarWidth: string;
  canvasPadding: string;
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
  dropdown: {
    [Skin.LIGHT]: {
      hoverBG: Color;
      hoverText: Color;
      inActiveBG: Color;
      inActiveText: Color;
    };
    [Skin.DARK]: {
      hoverBG: Color;
      hoverText: Color;
      inActiveBG: Color;
      inActiveText: Color;
      border: Color;
    };
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
  alert: Record<string, { color: Color }>;
  lightningMenu: {
    [Skin.DARK]: {
      default: {
        color: Color;
        background: Color;
      };
      active: {
        color: Color;
        background: Color;
      };
      hover: {
        color: Color;
        background: Color;
      };
      none: {
        color: string;
        background: string;
      };
    };
    [Skin.LIGHT]: {
      default: {
        color: Color;
        background: Color;
      };
      active: {
        color: Color;
        background: Color;
      };
      hover: {
        color: Color;
        background: Color;
      };
      none: {
        color: string;
        background: string;
      };
    };
  };
  iconSizes: iconSizeType;
};

type iconSizeType = {
  small: number;
  medium: number;
  large: number;
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

export const labelStyle = css`
  font-weight: ${props => props.theme.fontWeights[3]};
`;

// export const adsTheme: any = {
//   space: [0, 3, 14, 7, 16, 11, 26, 10, 4, 26, 30, 36, 4, 6, 11],
// };
// 3, 7, 11, 26

export const smallButton = css`
  font-size: ${props => props.theme.typography.btnSmall.fontSize}px;
  font-weight: ${props => props.theme.typography.btnSmall.fontWeight};
  line-height: ${props => props.theme.typography.btnSmall.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.btnSmall.letterSpacing}px;
`;

export const mediumButton = css`
  font-size: ${props => props.theme.typography.btnMedium.fontSize}px;
  font-weight: ${props => props.theme.typography.btnMedium.fontWeight};
  line-height: ${props => props.theme.typography.btnMedium.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.btnMedium.letterSpacing}px;
`;

export const largeButton = css`
  font-size: ${props => props.theme.typography.btnLarge.fontSize}px;
  font-weight: ${props => props.theme.typography.btnLarge.fontWeight};
  line-height: ${props => props.theme.typography.btnLarge.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.btnLarge.letterSpacing}px;
`;

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20, 50],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36],
  fontWeights: [0, 400, 500, 700],
  typography: {
    h1: {
      fontSize: 20,
      lineHeight: 27,
    },
    h2: {
      fontSize: 18,
      lineHeight: 25,
    },
    h3: {
      fontSize: 17,
      lineHeight: 22,
    },
    h4: {
      fontSize: 16,
      lineHeight: 21,
      letterSpacing: -0.24,
    },
    h5: {
      fontSize: 14,
      lineHeight: 19,
      letterSpacing: -0.24,
    },
    h6: {
      fontSize: 12,
      lineHeight: 14,
      letterSpacing: 0.8,
    },
    p1: {
      fontSize: 14,
      lineHeight: 19,
      letterSpacing: -0.24,
    },
    p2: {
      fontSize: 13,
      lineHeight: 17,
      letterSpacing: -0.24,
    },
    p3: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: -0.221538,
    },
    btnLarge: {
      fontSize: 13,
      lineHeight: 15,
      letterSpacing: 0.6,
      fontWeight: 600,
    },
    btnMedium: {
      fontSize: 12,
      lineHeight: 14,
      letterSpacing: 0.6,
      fontWeight: 600,
    },
    btnSmall: {
      fontSize: 11,
      lineHeight: 13,
      letterSpacing: 0.4,
      fontWeight: 600,
    },
  },
  iconSizes: {
    small: 12,
    medium: 14,
    large: 15,
  },
  propertyPane: {
    width: 270,
    height: 600,
    dividerColor: Colors.MAKO,
  },
  evaluatedValuePopup: {
    width: 300,
    height: 400,
  },
  drawerWidth: "80%",
  colors: {
    blackShades: [
      "#090707",
      "#1A191C",
      "#232324",
      "#2B2B2B",
      "#404040",
      "#6D6D6D",
      "#9F9F9F",
      "#D4D4D4",
      "#E9E9E9",
      "#FFFFFF",
    ],
    tertiary: {
      main: "#D4D4D4",
      light: "#FFFFFF",
      dark: "#2B2B2B",
      darker: "#202021",
    },
    info: {
      main: "#CB4810",
      dark: "#8B2E05",
      darker: "#A03C12",
      darkest: "#2B2B2B",
    },
    success: {
      main: "#218358",
      light: "#30CF89",
      dark: "#0F4B30",
      darker: "#17211E",
      darkest: "#293835",
    },
    warning: {
      main: "#EABB0C",
      light: "#FFD32E",
      dark: "#886B00",
      darker: "#2C271A",
      darkest: "#2F2A1B",
    },
    danger: {
      main: "#E22C2C",
      light: "#FF4D4D",
      dark: "#830C0C",
      darker: "#2B1A1D",
      darkest: "#462F32",
    },
    primaryOld: Colors.GREEN,
    primaryDarker: Colors.JUNGLE_GREEN,
    primaryDarkest: Colors.JUNGLE_GREEN_DARKER,
    secondary: Colors.GEYSER_LIGHT,
    secondaryDarker: Colors.CONCRETE,
    secondaryDarkest: Colors.MERCURY,
    error: Colors.RED,
    infoOld: Colors.SLATE_GRAY,
    hover: Colors.POLAR,
    inputActiveBorder: Colors.HIT_GRAY,
    inputInactiveBG: Colors.AQUA_HAZE,
    textDefault: Colors.BLACK_PEARL,
    textOnDarkBG: Colors.WHITE,
    textAnchor: Colors.PURPLE,
    border: Colors.GEYSER,
    paneCard: Colors.SHARK,
    paneInputBG: Colors.SHARK,
    paneBG: Colors.OUTER_SPACE,
    paneText: Colors.GRAY_CHATEAU,
    paneTextBG: Colors.DEEP_SPACE,
    paneTextUnderline: Colors.LIGHT_GREYISH_BLUE,
    paneSectionLabel: Colors.CADET_BLUE,
    navBG: Colors.SHARK,
    grid: Colors.TROUT,
    containerBorder: Colors.FRENCH_PASS,
    menuButtonBGInactive: Colors.JUNGLE_MIST,
    menuIconColorInactive: Colors.OXFORD_BLUE,
    bodyBG: Colors.ATHENS_GRAY,
    builderBodyBG: Colors.WHITE,
    widgetBorder: Colors.SLATE_GRAY,
    widgetSecondaryBorder: Colors.MERCURY,
    messageBG: Colors.CONCRETE,
    paneIcon: Colors.TROUT,
    notification: Colors.JAFFA,
    bindingTextDark: Colors.BINDING_COLOR,
    bindingText: Colors.BINDING_COLOR_LT,
    cmBacground: Colors.BLUE_CHARCOAL,
    lightningborder: Colors.ALABASTER,
  },
  lineHeights: [0, 14, 18, 22, 24, 28, 36, 48, 64, 80],
  fonts: [
    FontFamilies.DMSans,
    FontFamilies.AppsmithWidget,
    FontFamilies.FiraCode,
    FontFamilies.HomePageRedesign,
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
    {
      thickness: 3,
      style: "solid",
      color: Colors.MYSTIC,
    },
  ],
  sidebarWidth: "320px",
  headerHeight: "50px",
  canvasPadding: "20px 0 200px 0",
  sideNav: {
    maxWidth: 220,
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
  dropdown: {
    [Skin.LIGHT]: {
      hoverBG: Colors.GREEN,
      hoverText: Colors.WHITE,
      inActiveBG: Colors.WHITE,
      inActiveText: Colors.BLACK_PEARL,
    },
    [Skin.DARK]: {
      hoverBG: Colors.TROUT_DARK,
      hoverText: Colors.WHITE,
      inActiveBG: Colors.BLUE_CHARCOAL,
      inActiveText: Colors.WHITE,
      border: Colors.TROUT_DARK,
    },
  },
  authCard: {
    width: 612,
    borderRadius: 16,
    background: Colors.WHITE,
    padding: 40,
    dividerSpacing: 32,
    shadow: "0px 4px 8px rgba(9, 30, 66, 0.25)",
  },
  shadows: [
    "0px 2px 4px rgba(67, 70, 74, 0.14)",
    `0px 2px 4px ${Colors.MYSTIC}`,
    `inset -1px 0px 0px ${Colors.ATHENS_GRAY}, inset 1px 0px 0px ${Colors.ATHENS_GRAY}, inset 0px 4px 0px ${Colors.GREEN}`,
    `inset -1px 0px 0px ${Colors.ATHENS_GRAY}, inset 1px 0px 0px ${Colors.ATHENS_GRAY}, inset 0px 1px 0px ${Colors.ATHENS_GRAY}`,
  ],
  widgets: {
    tableWidget: {
      selectHighlightColor: Colors.GEYSER_LIGHT,
    },
  },
  pageContentWidth: 1224,
  alert: {
    info: {
      color: Colors.AZURE_RADIANCE,
    },
    success: {
      color: Colors.OCEAN_GREEN,
    },
    error: {
      color: Colors.RED,
    },
    warning: {
      color: Colors.BUTTER_CUP,
    },
  },
  lightningMenu: {
    [Skin.DARK]: {
      default: {
        color: Colors.ALABASTER,
        background: Colors.BLUE_CHARCOAL,
      },
      active: {
        color: Colors.BLUE_CHARCOAL,
        background: Colors.JAFFA_DARK,
      },
      hover: {
        color: Colors.BLUE_CHARCOAL,
        background: Colors.ALABASTER,
      },
      none: {
        color: "transparent",
        background: "transparent",
      },
    },
    [Skin.LIGHT]: {
      default: {
        color: Colors.BLUE_CHARCOAL,
        background: Colors.WHITE,
      },
      active: {
        color: Colors.BLUE_CHARCOAL,
        background: Colors.JAFFA_DARK,
      },
      hover: {
        color: Colors.WHITE,
        background: Colors.BLUE_CHARCOAL,
      },
      none: {
        color: "transparent",
        background: "transparent",
      },
    },
  },
};

export const scrollbarLight = css`
  scrollbar-color: ${props => props.theme.colors.paneText}
    
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props => getColorWithOpacity(props.theme.colors.paneText, 0.3)};
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneText};
    border-radius: ${props => props.theme.radii[1]}px;
  }
`;

export { css, createGlobalStyle, keyframes, ThemeProvider };
export default styled;
