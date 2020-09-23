import * as styledComponents from "styled-components";
import { Colors, Color } from "./Colors";
import * as FontFamilies from "./Fonts";
import tinycolor from "tinycolor2";
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

export const scrollbarDark = css`
  scrollbar-color: ${props => props.theme.colors.paneCard}
    ${props => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneCard};
    border-radius: ${props => props.theme.radii[1]}px;
  }
`;

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
  fonts: {
    code: FontFamily;
    text: FontFamily;
  };
  borders: ThemeBorder[];
  evaluatedValuePopup: {
    width: number;
    height: number;
  };
  propertyPane: PropertyPaneTheme;
  headerHeight: string;
  homePage: any;
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
  iconSizes: IconSizeType;
};

type IconSizeType = {
  XXS: number;
  XS: number;
  SMALL: number;
  MEDIUM: number;
  LARGE: number;
  XL: number;
  XXL: number;
  XXXL: number;
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
  if (border) {
    for (const [key, value] of Object.entries(border)) {
      values.push(key === "thickness" ? value + "px" : value.toString());
    }
  }
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

const darkShades = [
  "#1A191C",
  "#232324",
  "#262626",
  "#2B2B2B",
  "#404040",
  "#6D6D6D",
  "#9F9F9F",
  "#D4D4D4",
  "#E9E9E9",
  "#FFFFFF",
] as const;

const lightShades = [
  "#FAFAFA",
  "#F7F7F7",
  "#F0F0F0",
  "#E8E8E8",
  "#C5C5C5",
  "#A9A7A7",
  "#939090",
  "#716E6E",
  "#4B4848",
  "#302D2D",
  "#090707",
  "#FFFFFF",
] as const;

type ColorPalette = typeof darkShades[number] | typeof lightShades[number];

type buttonVariant = {
  main: string;
  light: string;
  dark: string;
  darker: string;
  darkest: string;
};

type ColorType = {
  button: {
    disabledText: ColorPalette;
  };
  tertiary: buttonVariant;
  info: buttonVariant;
  success: buttonVariant;
  warning: buttonVariant;
  danger: buttonVariant;
  homepageBackground: string;
  card: {
    hoverBG: Color;
    hoverBGOpacity: number;
    hoverBorder: ColorPalette;
    targetBg: string;
    iconColor: ColorPalette;
  };
  appCardColors: string[];
  text: {
    normal: ColorPalette;
    heading: ColorPalette;
    hightlight: ColorPalette;
  };
  icon: {
    normal: ColorPalette;
    hover: ColorPalette;
    active: ColorPalette;
  };
  appIcon: {
    normal: ColorPalette;
    background: ColorPalette;
  };
  menu: {
    background: ColorPalette;
    shadow: string;
  };
  menuItem: {
    normalText: ColorPalette;
    normalIcon: ColorPalette;
    hoverIcon: ColorPalette;
    hoverText: ColorPalette;
    hoverBg: ColorPalette;
  };
  colorSelector: {
    shadow: string;
    checkmark: ColorPalette;
  };
  checkbox: {
    disabled: ColorPalette;
    unchecked: ColorPalette;
    disabledCheck: string;
    normalCheck: ColorPalette;
    labelColor: ColorPalette;
  };
  dropdown: {
    header: {
      text: ColorPalette;
      disabled: ColorPalette;
      bg: ColorPalette;
      disabledBg: ColorPalette;
    };
    menuBg: ColorPalette;
    menuShadow: string;
    selected: {
      text: ColorPalette;
      bg: ColorPalette;
      icon: ColorPalette;
    };
    icon: ColorPalette;
  };
  toggle: {
    bg: ColorPalette;
    hover: {
      on: string;
      off: string;
    };
    disable: {
      on: string;
      off: ColorPalette;
    };
    disabledSlider: {
      on: ColorPalette;
      off: string;
    };
    spinner: ColorPalette;
  };
  textInput: {
    disable: {
      bg: ColorPalette;
      text: ColorPalette;
      border: ColorPalette;
    };
    normal: {
      bg: ColorPalette;
      text: ColorPalette;
      border: ColorPalette;
    };
    placeholder: ColorPalette;
  };
  menuBorder: ColorPalette;
  editableText: {
    color: ColorPalette;
    bg: string;
    dangerBg: string;
  };
  radio: {
    disable: string;
    border: ColorPalette;
  };
  searchInput: {
    placeholder: ColorPalette;
    text: ColorPalette;
    border: ColorPalette;
    bg: ColorPalette;
    icon: {
      focused: ColorPalette;
      normal: ColorPalette;
    };
  };
  spinner: ColorPalette;
  tableDropdown: {
    bg: ColorPalette;
    selectedBg: ColorPalette;
    selectedText: ColorPalette;
    shadow: string;
  };
  tabs: {
    normal: ColorPalette;
    hover: ColorPalette;
    border: ColorPalette;
  };
  settingHeading: ColorPalette;
  table: {
    headerBg: ColorPalette;
    headerText: ColorPalette;
    rowData: ColorPalette;
    rowTitle: ColorPalette;
    border: ColorPalette;
    hover: {
      headerColor: ColorPalette;
      rowBg: ColorPalette;
      rowTitle: ColorPalette;
      rowData: ColorPalette;
    };
  };
  applications: {
    bg: ColorPalette;
    textColor: ColorPalette;
    orgColor: ColorPalette;
    iconColor: ColorPalette;
    hover: {
      bg: ColorPalette;
      textColor: ColorPalette;
      orgColor: ColorPalette;
    };
  };
  switch: {
    border: ColorPalette;
    bg: ColorPalette;
    hover: {
      border: ColorPalette;
      bg: ColorPalette;
    };
    lightText: ColorPalette;
    darkText: ColorPalette;
  };
  queryTemplate: {
    bg: ColorPalette;
    color: ColorPalette;
  };
};

export const dark: ColorType = {
  button: {
    disabledText: darkShades[6],
  },
  tertiary: {
    main: "#D4D4D4",
    light: "#FFFFFF",
    dark: "#2B2B2B",
    darker: "#202021",
    darkest: "#1A191C",
  },
  info: {
    main: "#CB4810",
    light: "#F86A2B",
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
  homepageBackground: "#1C1C1E",
  card: {
    hoverBG: Colors.BLACK,
    hoverBGOpacity: 0.5,
    hoverBorder: darkShades[4],
    targetBg: "rgba(0, 0, 0, 0.1)",
    iconColor: darkShades[9],
  },
  appCardColors: [
    "#4F70FD",
    "#54A9FB",
    "#5ED3DA",
    "#F56AF4",
    "#F36380",
    "#FE9F44",
    "#E9C951",
    "#A8D76C",
    "#6C4CF1",
  ],
  text: {
    normal: darkShades[6],
    heading: darkShades[7],
    hightlight: darkShades[9],
  },
  icon: {
    normal: darkShades[6],
    hover: darkShades[8],
    active: darkShades[9],
  },
  appIcon: {
    normal: darkShades[9],
    background: darkShades[1],
  },
  menu: {
    background: darkShades[3],
    shadow: "rgba(0, 0, 0, 0.75)",
  },
  menuItem: {
    normalText: darkShades[7],
    normalIcon: darkShades[6],
    hoverIcon: darkShades[8],
    hoverText: darkShades[9],
    hoverBg: darkShades[4],
  },
  colorSelector: {
    shadow: "#353535",
    checkmark: darkShades[9],
  },
  checkbox: {
    disabled: darkShades[3],
    unchecked: darkShades[4],
    disabledCheck: "#565656",
    normalCheck: darkShades[9],
    labelColor: darkShades[7],
  },
  dropdown: {
    header: {
      text: darkShades[7],
      disabled: darkShades[6],
      bg: darkShades[2],
      disabledBg: darkShades[0],
    },
    menuBg: darkShades[3],
    menuShadow: "rgba(0, 0, 0, 0.6)",
    selected: {
      text: darkShades[9],
      bg: darkShades[4],
      icon: darkShades[8],
    },
    icon: darkShades[6],
  },
  toggle: {
    bg: darkShades[4],
    hover: {
      on: "#F56426",
      off: "#5E5E5E",
    },
    disable: {
      on: "#3D2219",
      off: darkShades[3],
    },
    disabledSlider: {
      on: darkShades[9],
      off: "#565656",
    },
    spinner: darkShades[6],
  },
  textInput: {
    disable: {
      bg: darkShades[2],
      text: darkShades[6],
      border: darkShades[2],
    },
    normal: {
      bg: darkShades[0],
      text: darkShades[9],
      border: darkShades[0],
    },
    placeholder: darkShades[5],
  },
  menuBorder: darkShades[4],
  editableText: {
    color: darkShades[9],
    bg: darkShades[1],
    dangerBg: "rgba(226, 44, 44, 0.08)",
  },
  radio: {
    disable: "#565656",
    border: darkShades[4],
  },
  searchInput: {
    placeholder: darkShades[5],
    text: darkShades[9],
    border: darkShades[4],
    bg: darkShades[2],
    icon: {
      focused: darkShades[7],
      normal: darkShades[5],
    },
  },
  spinner: darkShades[6],
  tableDropdown: {
    bg: darkShades[3],
    selectedBg: darkShades[4],
    selectedText: darkShades[9],
    shadow: "rgba(0, 0, 0, 0.75)",
  },
  tabs: {
    normal: darkShades[6],
    hover: darkShades[9],
    border: darkShades[3],
  },
  settingHeading: darkShades[9],
  table: {
    headerBg: darkShades[2],
    headerText: darkShades[5],
    rowData: darkShades[6],
    rowTitle: darkShades[7],
    border: darkShades[3],
    hover: {
      headerColor: darkShades[7],
      rowBg: darkShades[4],
      rowTitle: darkShades[9],
      rowData: darkShades[7],
    },
  },
  applications: {
    bg: darkShades[1],
    textColor: darkShades[7],
    orgColor: darkShades[7],
    iconColor: darkShades[7],
    hover: {
      bg: darkShades[4],
      textColor: darkShades[8],
      orgColor: darkShades[9],
    },
  },
  switch: {
    border: darkShades[5],
    bg: darkShades[0],
    hover: {
      border: darkShades[7],
      bg: darkShades[0],
    },
    lightText: darkShades[9],
    darkText: darkShades[6],
  },
  queryTemplate: {
    bg: darkShades[3],
    color: darkShades[7],
  },
};

export const light: ColorType = {
  button: {
    disabledText: lightShades[6],
  },
  tertiary: {
    main: "#716E6E",
    light: "#090707",
    dark: "#F7F7F7",
    darker: "#E8E8E8",
    darkest: "#939090",
  },
  info: {
    main: "#F86A2B",
    light: "#DC5B21",
    dark: "#BF4109",
    darker: "#FEEDE5",
    darkest: "#F7EBE6",
  },
  success: {
    main: "#03B365",
    light: "#007340",
    dark: "#00693B",
    darker: "#DEFFF0",
    darkest: "#CBF4E2",
  },
  warning: {
    main: "#FECB11",
    light: "#D1A606",
    dark: "#D9AC07",
    darker: "#FFFBEF",
    darkest: "#FECB11",
  },
  danger: {
    main: "#F22B2B",
    light: "#C60707",
    dark: "#B90707",
    darker: "#FFF0F0",
    darkest: "#FDE4E4",
  },
  homepageBackground: "#fafafa",
  card: {
    hoverBG: Colors.WHITE,
    hoverBGOpacity: 0.7,
    hoverBorder: lightShades[2],
    targetBg: "rgba(0, 0, 0, 0.1)",
    iconColor: lightShades[11],
  },
  appCardColors: [
    "#4266FD",
    "#69B5FF",
    "#5CE7EF",
    "#61DF48",
    "#FF6786",
    "#FFAD5E",
    "#FCD43E",
    "#B0E968",
    "#9177FF",
  ],
  text: {
    normal: lightShades[8],
    heading: lightShades[9],
    hightlight: lightShades[11],
  },
  icon: {
    normal: lightShades[4],
    hover: lightShades[8],
    active: lightShades[9],
  },
  appIcon: {
    normal: lightShades[7],
    background: lightShades[1],
  },
  menu: {
    background: lightShades[11],
    shadow: "rgba(0, 0, 0, 0.32)",
  },
  menuItem: {
    normalText: lightShades[8],
    normalIcon: lightShades[6],
    hoverIcon: lightShades[8],
    hoverText: lightShades[10],
    hoverBg: lightShades[2],
  },
  colorSelector: {
    shadow: lightShades[3],
    checkmark: lightShades[11],
  },
  checkbox: {
    disabled: lightShades[3],
    unchecked: lightShades[4],
    disabledCheck: lightShades[6],
    normalCheck: lightShades[11],
    labelColor: lightShades[9],
  },
  dropdown: {
    header: {
      text: lightShades[9],
      disabled: darkShades[6],
      bg: lightShades[2],
      disabledBg: lightShades[1],
    },
    menuBg: lightShades[11],
    menuShadow: "rgba(0, 0, 0, 0.32)",
    selected: {
      text: lightShades[9],
      bg: lightShades[2],
      icon: lightShades[8],
    },
    icon: lightShades[7],
  },
  toggle: {
    bg: lightShades[4],
    hover: {
      on: "#E4500E",
      off: lightShades[5],
    },
    disable: {
      on: "#FDE0D2",
      off: lightShades[3],
    },
    disabledSlider: {
      off: lightShades[11],
      on: lightShades[11],
    },
    spinner: lightShades[6],
  },
  textInput: {
    disable: {
      bg: lightShades[1],
      text: darkShades[6],
      border: lightShades[1],
    },
    normal: {
      bg: lightShades[2],
      text: lightShades[9],
      border: lightShades[2],
    },
    placeholder: lightShades[6],
  },
  menuBorder: lightShades[3],
  editableText: {
    color: lightShades[10],
    bg: "rgba(247, 247, 247, 0.8)",
    dangerBg: "rgba(242, 43, 43, 0.06)",
  },
  radio: {
    disable: lightShades[4],
    border: lightShades[3],
  },
  searchInput: {
    placeholder: lightShades[6],
    text: lightShades[10],
    border: lightShades[3],
    bg: lightShades[1],
    icon: {
      focused: lightShades[7],
      normal: lightShades[5],
    },
  },
  spinner: lightShades[6],
  tableDropdown: {
    bg: lightShades[11],
    selectedBg: lightShades[2],
    selectedText: lightShades[9],
    shadow: "rgba(0, 0, 0, 0.32)",
  },
  tabs: {
    normal: lightShades[6],
    hover: lightShades[10],
    border: lightShades[3],
  },
  settingHeading: lightShades[9],
  table: {
    headerBg: lightShades[1],
    headerText: lightShades[6],
    rowData: lightShades[7],
    rowTitle: lightShades[9],
    border: lightShades[3],
    hover: {
      headerColor: lightShades[9],
      rowBg: lightShades[2],
      rowTitle: lightShades[10],
      rowData: lightShades[9],
    },
  },
  applications: {
    bg: lightShades[2],
    textColor: lightShades[7],
    orgColor: lightShades[7],
    iconColor: lightShades[7],
    hover: {
      bg: lightShades[3],
      textColor: lightShades[8],
      orgColor: lightShades[9],
    },
  },
  switch: {
    border: lightShades[5],
    bg: lightShades[11],
    hover: {
      border: lightShades[7],
      bg: lightShades[11],
    },
    lightText: lightShades[11],
    darkText: lightShades[6],
  },
  queryTemplate: {
    bg: lightShades[3],
    color: lightShades[7],
  },
};

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20, 50],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36],
  fontWeights: [0, 400, 500, 700],
  typography: {
    h1: {
      fontSize: 20,
      lineHeight: 27,
      letterSpacing: "normal",
      fontWeight: 500,
    },
    h2: {
      fontSize: 18,
      lineHeight: 25,
      letterSpacing: "normal",
      fontWeight: 500,
    },
    h3: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: "normal",
      fontWeight: 500,
    },
    h4: {
      fontSize: 16,
      lineHeight: 21,
      letterSpacing: -0.24,
      fontWeight: 500,
    },
    h5: {
      fontSize: 14,
      lineHeight: 19,
      letterSpacing: -0.24,
      fontWeight: 500,
    },
    h6: {
      fontSize: 12,
      lineHeight: 14,
      letterSpacing: 0.8,
      fontWeight: 500,
    },
    p1: {
      fontSize: 14,
      lineHeight: 19,
      letterSpacing: -0.24,
      fontWeight: "normal",
    },
    p2: {
      fontSize: 13,
      lineHeight: 17,
      letterSpacing: -0.24,
      fontWeight: "normal",
    },
    p3: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: -0.221538,
      fontWeight: "normal",
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
    XXS: 8,
    XS: 10,
    SMALL: 12,
    MEDIUM: 14,
    LARGE: 15,
    XL: 16,
    XXL: 18,
    XXXL: 20,
  },
  propertyPane: {
    width: 270,
    height: 600,
    dividerColor: Colors.MAKO,
  },
  evaluatedValuePopup: {
    width: 300,
    height: 500,
  },
  drawerWidth: "80%",
  colors: {
    tooltip: {
      lightBg: lightShades[0],
      darkBg: lightShades[10],
    },
    callout: {
      note: {
        dark: {
          color: "#EE5A1A",
          bgColor: "#241C1B",
        },
        light: {
          color: "#D44100",
          bgColor: "#F8F3F0",
        },
      },
      warning: {
        light: {
          color: "#DCAD00",
          bgColor: "#FAF6E6",
        },
        dark: {
          color: "#E0B30E",
          bgColor: "#29251A",
        },
      },
    },
    appBackground: "#EFEFEF",
    primaryOld: Colors.GREEN,
    primaryDarker: Colors.JUNGLE_GREEN,
    primaryDarkest: Colors.JUNGLE_GREEN_DARKER,
    secondary: Colors.GEYSER_LIGHT,
    secondaryDarker: Colors.CONCRETE,
    secondaryDarkest: Colors.MERCURY,
    error: Colors.RED,
    infoOld: Colors.SLATE_GRAY,
    errorMessage: Colors.ERROR_RED,
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
  lineHeights: [0, 14, 16, 18, 22, 24, 28, 36, 48, 64, 80],
  fonts: {
    text: FontFamilies.TextFonts,
    code: FontFamilies.CodeFonts,
  },
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
  homePage: {
    header: 52,
    leftPane: {
      width: 240,
      leftPadding: 16,
      rightMargin: 113,
    },
    search: {
      height: 68,
      paddingTop: 30,
    },
  },
  headerHeight: "48px",
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
    minWidth: 150,
    minHeight: 150,
    titleHeight: 48,
    divider: {
      thickness: 1,
      style: "solid",
      color: Colors.GEYSER_LIGHT,
    },
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

export const scrollbarLight = css<{ backgroundColor?: Color }>`
  scrollbar-color: ${props => props.theme.colors.paneText}

  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props =>
        props.backgroundColor
          ? props.backgroundColor
          : getColorWithOpacity(props.theme.colors.paneText, 0.3)};
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneText};
    border-radius: ${props => props.theme.radii[1]}px;
  }
`;

export { css, createGlobalStyle, keyframes, ThemeProvider };
export default styled;
