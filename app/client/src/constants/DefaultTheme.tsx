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

export const hideScrollbar = css`
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
    -webkit-appearance: none;
  }
`;

export const scrollbarDark = css`
  scrollbar-color: ${(props) => props.theme.colors.paneCard}
    ${(props) => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${(props) => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.paneCard};
    border-radius: ${(props) => props.theme.radii[1]}px;
  }
`;

export const getTypographyByKey = (props: Record<string, any>, key: string) => `
  font-weight: ${props.theme.typography[key].fontWeight};
  font-size: ${props.theme.typography[key].fontSize}px;
  line-height: ${props.theme.typography[key].lineHeight}px;
  letter-spacing: ${props.theme.typography[key].letterSpacing}px;
`;

export const BlueprintControlTransform = css`
  && {
    .${Classes.CONTROL} {
      & input:checked ~ .${Classes.CONTROL_INDICATOR} {
        background: ${(props) => props.theme.colors.primaryOld};
        box-shadow: none;
        border: 2px solid ${(props) => props.theme.colors.primaryOld};
      }
      & input:not(:disabled):active ~ .${Classes.CONTROL_INDICATOR} {
        box-shadow: none;
        border: 2px solid ${Colors.SLATE_GRAY};
      }
      & input:not(:disabled):active:checked ~ .${Classes.CONTROL_INDICATOR} {
        box-shadow: none;
        border: 2px solid ${Colors.SLATE_GRAY};
      }
      &:hover .${Classes.CONTROL_INDICATOR} {
        box-shadow: none;
        background: none;
        border: 2px solid ${Colors.SLATE_GRAY};
      }
    }

    .${Classes.CHECKBOX} .${Classes.CONTROL_INDICATOR} {
      border-radius: 0;
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
      border-radius: 0;
      background: white;
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
      font-weight: ${(props) => props.theme.fontWeights[3]};
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
      border-radius: ${(props) => props.theme.radii[1]}px;
      box-shadow: none;
      border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
      &:focus {
        border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
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
  smallHeaderHeight: string;
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
      hoverBG: ShadeColor;
      hoverText: ShadeColor;
      inActiveBG: ShadeColor;
      inActiveText: ShadeColor;
    };
    [Skin.DARK]: {
      hoverBG: ShadeColor;
      hoverText: ShadeColor;
      inActiveBG: ShadeColor;
      inActiveText: ShadeColor;
      border: Color;
      background: Color;
    };
  };
  authCard: {
    width: number;
    dividerSpacing: number;
    formMessageWidth: number;
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
        color: string;
        background: string;
      };
      active: {
        color: string;
        background: string;
      };
      hover: {
        color: string;
        background: string;
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
  font-weight: ${(props) => props.theme.fontWeights[3]};
`;

// export const adsTheme: any = {
//   space: [0, 3, 14, 7, 16, 11, 26, 10, 4, 26, 30, 36, 4, 6, 11],
// };
// 3, 7, 11, 26

export const smallButton = css`
  font-size: ${(props) => props.theme.typography.btnSmall.fontSize}px;
  font-weight: ${(props) => props.theme.typography.btnSmall.fontWeight};
  line-height: ${(props) => props.theme.typography.btnSmall.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.btnSmall.letterSpacing}px;
`;

export const mediumButton = css`
  font-size: ${(props) => props.theme.typography.btnMedium.fontSize}px;
  font-weight: ${(props) => props.theme.typography.btnMedium.fontWeight};
  line-height: ${(props) => props.theme.typography.btnMedium.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.btnMedium.letterSpacing}px;
`;

export const largeButton = css`
  font-size: ${(props) => props.theme.typography.btnLarge.fontSize}px;
  font-weight: ${(props) => props.theme.typography.btnLarge.fontWeight};
  line-height: ${(props) => props.theme.typography.btnLarge.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.btnLarge.letterSpacing}px;
`;

export const appColors = [
  "#6C4CF1",
  "#4F70FD",
  "#F56AF4",
  "#B94CF1",
  "#54A9FB",
  "#5ED3DA",
  "#5EDA82",
  "#A8D76C",
  "#E9C951",
  "#FE9F44",
  "#ED86A1",
  "#EA6179",
  "#C03C3C",
  "#BC6DB2",
  "#6C9DD0",
  "#6CD0CF",
] as const;

export type AppColorCode = typeof appColors[number];

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

type ShadeColor = typeof darkShades[number] | typeof lightShades[number];

type buttonVariant = {
  main: string;
  light: string;
  dark: string;
  darker: string;
  darkest: string;
};

type ColorType = {
  button: {
    disabledText: ShadeColor;
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
    hoverBorder: ShadeColor;
    iconColor: ShadeColor;
  };
  text: {
    normal: ShadeColor;
    heading: ShadeColor;
    highlight: ShadeColor;
  };
  icon: {
    normal: ShadeColor;
    hover: ShadeColor;
    active: ShadeColor;
  };
  appIcon: {
    normal: ShadeColor;
    background: ShadeColor;
  };
  menu: {
    background: ShadeColor;
    shadow: string;
  };
  menuItem: {
    normalText: ShadeColor;
    normalIcon: ShadeColor;
    hoverIcon: ShadeColor;
    hoverText: ShadeColor;
    hoverBg: ShadeColor;
    warning: {
      color: string;
      bg: string;
    };
  };
  colorSelector: {
    shadow: ShadeColor;
    checkmark: ShadeColor;
  };
  checkbox: {
    disabled: ShadeColor;
    unchecked: ShadeColor;
    disabledCheck: ShadeColor;
    normalCheck: ShadeColor;
    labelColor: ShadeColor;
  };
  dropdown: {
    header: {
      text: ShadeColor;
      disabledText: ShadeColor;
      bg: ShadeColor;
      disabledBg: ShadeColor;
    };
    menuBg: ShadeColor;
    menuShadow: string;
    selected: {
      text: ShadeColor;
      bg: ShadeColor;
      icon: ShadeColor;
    };
    icon: ShadeColor;
  };
  toggle: {
    bg: ShadeColor;
    hover: {
      on: string;
      off: string;
    };
    disable: {
      on: string;
      off: ShadeColor;
    };
    disabledSlider: {
      on: ShadeColor;
      off: ShadeColor;
    };
    spinner: ShadeColor;
  };
  textInput: {
    disable: {
      bg: ShadeColor;
      text: ShadeColor;
      border: ShadeColor;
    };
    normal: {
      bg: ShadeColor;
      text: ShadeColor;
      border: ShadeColor;
    };
    placeholder: ShadeColor;
    readOnly: {
      bg: ShadeColor;
      border: ShadeColor;
      text: ShadeColor;
    };
  };
  menuBorder: ShadeColor;
  editableText: {
    color: ShadeColor;
    bg: ShadeColor;
    dangerBg: string;
  };
  radio: {
    disable: ShadeColor;
    border: ShadeColor;
    text: ShadeColor;
  };
  searchInput: {
    placeholder: ShadeColor;
    text: ShadeColor;
    border: ShadeColor;
    bg: ShadeColor;
    icon: {
      focused: ShadeColor;
      normal: ShadeColor;
    };
  };
  spinner: ShadeColor;
  tableDropdown: {
    bg: ShadeColor;
    selectedBg: ShadeColor;
    selectedText: ShadeColor;
    shadow: string;
  };
  tabs: {
    normal: ShadeColor;
    hover: ShadeColor;
    border: ShadeColor;
  };
  settingHeading: ShadeColor;
  table: {
    headerBg: ShadeColor;
    headerText: ShadeColor;
    rowData: ShadeColor;
    rowTitle: ShadeColor;
    border: ShadeColor;
    hover: {
      headerColor: ShadeColor;
      rowBg: ShadeColor;
      rowTitle: ShadeColor;
      rowData: ShadeColor;
    };
  };
  applications: {
    bg: ShadeColor;
    textColor: ShadeColor;
    orgColor: ShadeColor;
    iconColor: ShadeColor;
    hover: {
      bg: ShadeColor;
      textColor: ShadeColor;
      orgColor: ShadeColor;
    };
  };
  switch: {
    border: ShadeColor;
    bg: ShadeColor;
    hover: {
      bg: ShadeColor;
    };
    lightText: ShadeColor;
    darkText: ShadeColor;
  };
  queryTemplate: {
    bg: ShadeColor;
    color: ShadeColor;
  };
  profileDropdown: {
    userName: ShadeColor;
  };
  modal: {
    bg: ShadeColor;
    headerText: ShadeColor;
    iconColor: string;
    user: {
      textColor: ShadeColor;
    };
    email: {
      message: ShadeColor;
      desc: ShadeColor;
    };
    manageUser: ShadeColor;
    scrollbar: ShadeColor;
    separator: ShadeColor;
    title: ShadeColor;
    link: string;
    hoverState: ShadeColor;
  };
  tagInput: {
    bg: ShadeColor;
    tag: {
      text: ShadeColor;
    };
    text: ShadeColor;
    placeholder: ShadeColor;
    shadow: string;
  };
  callout: {
    info: {
      color: string;
      bgColor: string;
    };
    success: {
      color: string;
      bgColor: string;
    };
    danger: {
      color: string;
      bgColor: string;
    };
    warning: {
      color: string;
      bgColor: string;
    };
  };
  loader: {
    light: ShadeColor;
    dark: ShadeColor;
  };
  filePicker: {
    bg: ShadeColor;
    color: ShadeColor;
    progress: ShadeColor;
    shadow: {
      from: string;
      to: string;
    };
  };
  formFooter: {
    cancelBtn: ShadeColor;
  };
  toast: {
    undo: string;
    warningColor: string;
    dangerColor: string;
    textColor: string;
    bg: ShadeColor;
  };
  multiSwitch: {
    bg: ShadeColor;
    selectedBg: ShadeColor;
    text: ShadeColor;
    border: string;
  };
  apiPane: {
    bg: ShadeColor;
    text: ShadeColor;
    dividerBg: ShadeColor;
    iconHoverBg: ShadeColor;
    requestTree: {
      bg: string;
      header: {
        text: string;
        icon: string;
        bg: string;
      };
      row: {
        hoverBg: string;
        key: string;
        value: string;
      };
    };
    moreActions: {
      targetBg: string;
      targetIcon: {
        normal: string;
        hover: string;
      };
      menuShadow: string;
      menuBg: {
        normal: ShadeColor;
        hover: ShadeColor;
      };
      menuText: {
        normal: ShadeColor;
        hover: ShadeColor;
      };
    };
    closeIcon: ShadeColor;
    responseBody: {
      bg: ShadeColor;
    };
    codeEditor: {
      placeholderColor: ShadeColor;
    };
    body: {
      text: string;
    };
    settings: {
      textColor: ShadeColor;
    };
    pagination: {
      label: ShadeColor;
      description: ShadeColor;
      stepTitle: ShadeColor;
      numberBg: string;
      bindingBg: ShadeColor;
      numberColor: ShadeColor;
    };
  };
  codeMirror: {
    background: {
      defaultState: string;
      hoverState: string;
    };
    text: string;
    dataType: {
      shortForm: string;
      fullForm: string;
    };
  };
  floatingBtn: any;
  auth: any;
  formMessage: Record<string, Record<Intent, string>>;
  header: {
    separator: string;
    appName: ShadeColor;
    background: string;
    deployToolTipBackground: string;
    deployToolTipText: ShadeColor;
    shareBtnHighlight: string;
    shareBtn: string;
    tabsHorizontalSeparator: string;
    tabText: string;
    activeTabBorderBottom: string;
    activeTabText: string;
  };
  gif: {
    overlay: string;
    text: string;
    iconPath: string;
    iconCircle: string;
  };
};

const auth: any = {
  background: darkShades[1],
  cardBackground: lightShades[10],
  btnPrimary: "#F86A2B",
  inputBackground: darkShades[1],
  headingText: "#FFF",
  link: "#106ba3",
  text: darkShades[7],
  placeholder: darkShades[5],
  socialBtnText: darkShades[8],
  socialBtnBorder: darkShades[8],
  socialBtnHighlight: darkShades[1],
};

const formMessage = {
  background: {
    danger: "rgba(226,44,44,0.08)",
    success: "#172320",
    warning: "rgba(224, 179, 14, 0.08)",
  },
  text: {
    danger: "#E22C2C",
    success: "#03B365",
    warning: "#E0B30E",
  },
};

export const dark: ColorType = {
  header: {
    separator: darkShades[4],
    appName: darkShades[7],
    background: darkShades[2],
    deployToolTipBackground: lightShades[10],
    deployToolTipText: darkShades[7],
    shareBtnHighlight: "#F86A2B",
    shareBtn: "#fff",
    tabsHorizontalSeparator: "#EFEFEF",
    tabText: "#6F6D6D",
    activeTabBorderBottom: "#FF6D2D",
    activeTabText: "#000",
  },
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
    iconColor: darkShades[9],
  },
  text: {
    normal: darkShades[6],
    heading: darkShades[7],
    highlight: darkShades[9],
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
    warning: {
      color: "#EABB0C",
      bg: "#3A3628",
    },
  },
  colorSelector: {
    shadow: darkShades[4],
    checkmark: darkShades[9],
  },
  checkbox: {
    disabled: darkShades[3],
    unchecked: darkShades[4],
    disabledCheck: darkShades[5],
    normalCheck: darkShades[9],
    labelColor: darkShades[7],
  },
  dropdown: {
    header: {
      text: darkShades[7],
      disabledText: darkShades[6],
      bg: "#090707",
      disabledBg: darkShades[2],
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
      off: darkShades[5],
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
      bg: lightShades[10],
      border: darkShades[0],
      text: darkShades[7],
    },
    placeholder: darkShades[5],
    readOnly: {
      bg: darkShades[0],
      border: darkShades[0],
      text: darkShades[7],
    },
  },
  menuBorder: darkShades[4],
  editableText: {
    color: darkShades[9],
    bg: darkShades[1],
    dangerBg: "rgba(226, 44, 44, 0.08)",
  },
  radio: {
    disable: darkShades[5],
    border: darkShades[4],
    text: lightShades[11],
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
    hover: darkShades[7],
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
    bg: darkShades[4],
    textColor: darkShades[7],
    orgColor: darkShades[7],
    iconColor: darkShades[7],
    hover: {
      bg: darkShades[5],
      textColor: darkShades[8],
      orgColor: darkShades[9],
    },
  },
  switch: {
    border: darkShades[5],
    bg: darkShades[0],
    hover: {
      bg: darkShades[0],
    },
    lightText: darkShades[9],
    darkText: darkShades[6],
  },
  queryTemplate: {
    bg: darkShades[3],
    color: darkShades[7],
  },
  profileDropdown: {
    userName: darkShades[9],
  },
  modal: {
    bg: darkShades[1],
    headerText: darkShades[9],
    iconColor: "#6D6D6D",
    user: {
      textColor: darkShades[7],
    },
    email: {
      message: darkShades[8],
      desc: darkShades[6],
    },
    manageUser: darkShades[6],
    scrollbar: darkShades[5],
    separator: darkShades[4],
    title: darkShades[8],
    link: "#F86A2B",
    hoverState: darkShades[3],
  },
  tagInput: {
    bg: "#090707",
    tag: {
      text: darkShades[9],
    },
    text: darkShades[9],
    placeholder: darkShades[5],
    shadow: "0px 0px 4px 4px rgba(203, 72, 16, 0.18)",
  },
  callout: {
    info: {
      color: "#EE5A1A",
      bgColor: "#241C1B",
    },
    success: {
      color: "#30CF89",
      bgColor: "#17211E",
    },
    danger: {
      color: "#FF4D4D",
      bgColor: "#2B1A1D",
    },
    warning: {
      color: "#E0B30E",
      bgColor: "#29251A",
    },
  },
  loader: {
    light: darkShades[2],
    dark: darkShades[4],
  },
  filePicker: {
    bg: darkShades[1],
    color: darkShades[7],
    progress: darkShades[6],
    shadow: {
      from: "rgba(21, 17, 17, 0.0001)",
      to: "rgba(9, 7, 7, 0.883386)",
    },
  },
  formFooter: {
    cancelBtn: darkShades[9],
  },
  toast: {
    undo: "#CB4810",
    warningColor: "#E0B30E",
    dangerColor: "#E22C2C",
    textColor: "#090707",
    bg: darkShades[8],
  },
  multiSwitch: {
    bg: darkShades[2],
    selectedBg: lightShades[10],
    text: darkShades[8],
    border: darkShades[3],
  },
  apiPane: {
    bg: darkShades[0],
    text: darkShades[6],
    dividerBg: darkShades[4],
    iconHoverBg: darkShades[1],
    requestTree: {
      bg: lightShades[10],
      header: {
        text: darkShades[7],
        icon: darkShades[7],
        bg: darkShades[1],
      },
      row: {
        hoverBg: darkShades[1],
        key: darkShades[6],
        value: darkShades[7],
      },
    },
    moreActions: {
      targetBg: "#090707",
      targetIcon: {
        normal: "#9F9F9F",
        hover: "#9F9F9F",
      },
      menuShadow: "0px 12px 28px -8px rgba(0, 0, 0, 0.75)",
      menuBg: {
        normal: darkShades[3],
        hover: darkShades[4],
      },
      menuText: {
        normal: darkShades[7],
        hover: darkShades[9],
      },
    },
    closeIcon: darkShades[9],
    responseBody: {
      bg: "#090707",
    },
    codeEditor: {
      placeholderColor: darkShades[5],
    },
    body: {
      text: "#6D6D6D",
    },
    settings: {
      textColor: "#FFFFFF",
    },
    pagination: {
      label: darkShades[7],
      description: darkShades[5],
      stepTitle: darkShades[9],
      numberBg: darkShades[3],
      bindingBg: darkShades[4],
      numberColor: lightShades[11],
    },
  },
  codeMirror: {
    background: {
      defaultState: "#262626",
      hoverState: "#1A191C",
    },
    text: "#FFFFFF",
    dataType: {
      shortForm: "#858282",
      fullForm: "#6D6D6D",
    },
  },
  floatingBtn: {
    tagBackground: "#e22c2c",
    backgroundColor: darkShades[3],
    iconColor: darkShades[6],
  },
  auth,
  formMessage,
  gif: {
    overlay: "#000000",
    text: "#d4d4d4",
    iconPath: "#2b2b2b",
    iconCircle: "#d4d4d4",
  },
};

export const light: ColorType = {
  header: {
    separator: "#E0DEDE",
    appName: lightShades[8],
    background: lightShades[0],
    deployToolTipText: lightShades[8],
    deployToolTipBackground: "#FFF",
    shareBtnHighlight: "#F86A2B",
    shareBtn: "#4B4848",
    tabsHorizontalSeparator: "#EFEFEF",
    tabText: "#6F6D6D",
    activeTabBorderBottom: "#FF6D2D",
    activeTabText: "#000",
  },
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
    iconColor: lightShades[11],
  },
  text: {
    normal: lightShades[8],
    heading: lightShades[9],
    highlight: lightShades[11],
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
    warning: {
      color: "#D2A500",
      bg: "#FDFAF2",
    },
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
      disabledText: darkShades[6],
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
    placeholder: lightShades[7],
    readOnly: {
      bg: lightShades[2],
      border: lightShades[2],
      text: lightShades[7],
    },
  },
  menuBorder: lightShades[3],
  editableText: {
    color: lightShades[10],
    bg: lightShades[2],
    dangerBg: "rgba(242, 43, 43, 0.06)",
  },
  radio: {
    disable: lightShades[4],
    border: lightShades[3],
    text: lightShades[10],
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
    bg: lightShades[3],
    textColor: lightShades[7],
    orgColor: lightShades[7],
    iconColor: lightShades[7],
    hover: {
      bg: lightShades[5],
      textColor: lightShades[8],
      orgColor: lightShades[9],
    },
  },
  switch: {
    border: lightShades[5],
    bg: lightShades[11],
    hover: {
      bg: lightShades[11],
    },
    lightText: lightShades[11],
    darkText: lightShades[6],
  },
  queryTemplate: {
    bg: lightShades[3],
    color: lightShades[7],
  },
  profileDropdown: {
    userName: lightShades[9],
  },
  modal: {
    bg: lightShades[11],
    headerText: lightShades[10],
    iconColor: lightShades[5],
    user: {
      textColor: lightShades[9],
    },
    email: {
      message: lightShades[9],
      desc: lightShades[7],
    },
    manageUser: lightShades[6],
    scrollbar: lightShades[5],
    separator: lightShades[4],
    title: lightShades[8],
    link: "#F86A2B",
    hoverState: lightShades[3],
  },
  tagInput: {
    bg: lightShades[2],
    tag: {
      text: lightShades[11],
    },
    text: lightShades[9],
    placeholder: darkShades[7],
    shadow: "0px 0px 4px 4px rgba(203, 72, 16, 0.18)",
  },
  callout: {
    info: {
      color: "#D44100",
      bgColor: "#F8F3F0",
    },
    success: {
      color: "#03B365",
      bgColor: "#E4F4ED",
    },
    danger: {
      color: "#F22B2B",
      bgColor: "#F9E9E9",
    },
    warning: {
      color: "#FEB811",
      bgColor: "#FAF3E3",
    },
  },
  loader: {
    light: lightShades[2],
    dark: lightShades[4],
  },
  filePicker: {
    bg: lightShades[2],
    color: lightShades[7],
    progress: lightShades[6],
    shadow: {
      from: "rgba(253, 253, 253, 0.0001)",
      to: "rgba(250, 250, 250, 0.898847)",
    },
  },
  formFooter: {
    cancelBtn: lightShades[9],
  },
  toast: {
    undo: "#F86A2B",
    warningColor: "#DCAD00",
    dangerColor: "#F22B2B",
    textColor: "#F7F7F7",
    bg: lightShades[10],
  },
  multiSwitch: {
    bg: lightShades[3],
    selectedBg: lightShades[11],
    text: lightShades[8],
    border: "#E0DEDE",
  },
  apiPane: {
    bg: lightShades[11],
    text: lightShades[6],
    dividerBg: lightShades[3],
    iconHoverBg: lightShades[1],
    requestTree: {
      bg: lightShades[11],
      header: {
        text: lightShades[8],
        icon: lightShades[8],
        bg: lightShades[2],
      },
      row: {
        hoverBg: lightShades[2],
        key: lightShades[7],
        value: lightShades[8],
      },
    },
    moreActions: {
      targetBg: "#E8E8E8",
      targetIcon: {
        normal: "#939090",
        hover: "#4B4848",
      },
      menuShadow: "0px 12px 28px -8px rgba(0, 0, 0, 0.32)",
      menuBg: {
        normal: lightShades[11],
        hover: lightShades[2],
      },
      menuText: {
        normal: lightShades[6],
        hover: lightShades[8],
      },
    },
    closeIcon: lightShades[10],
    responseBody: {
      bg: lightShades[11],
    },
    codeEditor: {
      placeholderColor: lightShades[5],
    },
    body: {
      text: "#A9A7A7",
    },
    settings: {
      textColor: "#090707",
    },
    pagination: {
      label: lightShades[8],
      description: lightShades[5],
      stepTitle: lightShades[10],
      numberBg: "#E0DEDE",
      bindingBg: lightShades[3],
      numberColor: lightShades[10],
    },
  },
  codeMirror: {
    background: {
      defaultState: "#EBEBEB",
      hoverState: "#FAFAFA",
    },
    text: "#090707",
    dataType: {
      shortForm: "#858282",
      fullForm: "#6D6D6D",
    },
  },
  floatingBtn: {
    tagBackground: "#e22c2c",
    backgroundColor: lightShades[3],
    iconColor: lightShades[7],
  },
  auth,
  formMessage,
  gif: {
    overlay: "#ffffff",
    text: "#6f6f6f",
    iconPath: "#c4c4c4",
    iconCircle: "#090707",
  },
};

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20, 50],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36, 38, 40, 42, 44],
  fontWeights: [0, 400, 500, 700],
  typography: {
    h1: {
      fontSize: 20,
      lineHeight: 27,
      letterSpacing: -0.204,
      fontWeight: 500,
    },
    h2: {
      fontSize: 18,
      lineHeight: 25,
      letterSpacing: -0.204,
      fontWeight: 500,
    },
    h3: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.204,
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
    floatingBtn: {
      fontSize: 14,
      lineHeight: 17,
      letterSpacing: -0.24,
      fontWeight: "normal",
    },
    releaseList: {
      fontSize: 14,
      lineHeight: 23,
      letterSpacing: -0.24,
      fontWeight: "normal",
    },
    authCardHeader: {
      fontStyle: "normal",
      fontWeight: 600,
      fontSize: 25,
      lineHeight: 20,
    },
    authCardSubheader: {
      fontStyle: "normal",
      fontWeight: "normal",
      fontSize: 15,
      lineHeight: 20,
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
    appBackground: "#EDEDED",
    artboard: "#F6F6F6",
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
    formButtonColor: Colors.WHITE,
    appCardColors: appColors,
    dataTypeBg: {
      function: "#BDB2FF",
      object: "#FFD6A5",
      unknown: "#4bb",
      array: "#CDFFA5",
      number: "#FFB2B2",
    },
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
  smallHeaderHeight: "35px",
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
      hoverBG: lightShades[0],
      hoverText: lightShades[10],
      inActiveBG: lightShades[3],
      inActiveText: lightShades[8],
    },
    [Skin.DARK]: {
      hoverBG: darkShades[0],
      hoverText: darkShades[9],
      inActiveBG: darkShades[2],
      inActiveText: darkShades[7],
      border: Colors.TROUT_DARK,
      background: darkShades[4],
    },
  },
  authCard: {
    width: 440,
    dividerSpacing: 32,
    formMessageWidth: 370,
  },
  shadows: [
    /* 0. tab */
    `inset -1px 0px 0px ${Colors.ATHENS_GRAY}, inset 1px 0px 0px ${Colors.ATHENS_GRAY}, inset 0px 4px 0px ${Colors.GREEN}`,
    /* 1. first tab */
    `inset -1px 0px 0px ${Colors.ATHENS_GRAY}, inset 0px 0px 0px ${Colors.ATHENS_GRAY}, inset 0px 4px 0px ${Colors.GREEN}`,
    /* 2. container */
    `0 1px 1px 0 rgba(60,75,100,.14) ,0 2px 1px -1px rgba(60,75,100,.12), 0 1px 3px 0 rgba(60,75,100,.2)`,
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
        color: darkShades[7],
        background: "transparent",
      },
      active: {
        color: darkShades[9],
        background: dark.info.main,
      },
      hover: {
        color: darkShades[9],
        background: darkShades[7],
      },
      none: {
        color: "transparent",
        background: "transparent",
      },
    },
    [Skin.LIGHT]: {
      default: {
        color: lightShades[7],
        background: "transparent",
      },
      active: {
        color: lightShades[11],
        background: dark.info.light,
      },
      hover: {
        color: lightShades[11],
        background: lightShades[7],
      },
      none: {
        color: "transparent",
        background: "transparent",
      },
    },
  },
};

export const scrollbarLight = css<{ backgroundColor?: Color }>`
  scrollbar-color: ${(props) => props.theme.colors.paneText};

  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${(props) =>
        props.backgroundColor
          ? props.backgroundColor
          : getColorWithOpacity(props.theme.colors.paneText, 0.3)};
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.paneText};
    border-radius: ${(props) => props.theme.radii[1]}px;
  }
`;

export { css, createGlobalStyle, keyframes, ThemeProvider };

export default styled;
