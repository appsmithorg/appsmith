import * as styledComponents from "styled-components";
import { Colors, Color } from "./Colors";
import * as FontFamilies from "./Fonts";
import tinycolor from "tinycolor2";
import { Classes } from "@blueprintjs/core";
import { AlertIcons } from "icons/AlertIcons";
import { IconProps } from "constants/IconConstants";
import { JSXElementConstructor } from "react";
import { typography, Typography, TypographyKeys } from "./typography";
export type FontFamily = typeof FontFamilies[keyof typeof FontFamilies];

const {
  createGlobalStyle,
  css,
  default: styled,
  keyframes,
  ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<Theme>;

export const IntentColors: Record<string, Color> = {
  primary: Colors.GREEN,
  success: Colors.PURPLE,
  secondary: Colors.BLACK_PEARL,
  danger: Colors.ERROR_RED,
  none: Colors.GEYSER_LIGHT,
  warning: Colors.JAFFA,
  successLight: Colors.GREEN,
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

export const truncateTextUsingEllipsis = css`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  display: block;
`;

export const getTypographyByKey = (
  props: Record<string, any>,
  key: TypographyKeys,
) => `
  font-weight: ${props.theme.typography[key].fontWeight};
  font-size: ${props.theme.typography[key].fontSize}px;
  line-height: ${props.theme.typography[key].lineHeight}px;
  letter-spacing: ${props.theme.typography[key].letterSpacing}px;
`;

export const BlueprintControlTransform = css`
  && {
    .${Classes.CONTROL}.${Classes.DISABLED} {
      color: ${Colors.GREY_8};
    }
    .${Classes.CONTROL} {
      & input:checked ~ .${Classes.CONTROL_INDICATOR} {
        background: ${(props) => props.theme.colors.primaryOld};
        box-shadow: none;
        border: 1px solid ${(props) => props.theme.colors.primaryOld};
      }
      input:disabled ~ .${Classes.CONTROL_INDICATOR} {
        opacity: 0.5;
      }
      & input:disabled:not(:checked) ~ .${Classes.CONTROL_INDICATOR} {
        border: 1px solid ${Colors.GREY_5};
      }
    }

    .${Classes.SWITCH} {
      & .${Classes.CONTROL_INDICATOR} {
        &::before {
          box-shadow: -2px 2px 5px rgba(67, 86, 100, 0.1);
        }
      }
      input:checked ~ .${Classes.CONTROL_INDICATOR} {
        &::before {
          left: calc(105% - 1em);
        }
      }
      input:not(:checked) ~ .${Classes.CONTROL_INDICATOR} {
        background: ${Colors.GREY_3};
        border: 1px solid ${Colors.GREY_5};
      }
    }

    .${Classes.CONTROL_INDICATOR} {
      &::before {
        position: absolute;
        left: -1px;
        top: -1px;
      }
    }
  }
`;

export const invisible = css`
  && > * {
    opacity: 0.6;
  }
`;

export const disable = css`
  & {
    cursor: not-allowed;

    & > * {
      opacity: 0.5;
      pointer-events: none;
    }
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

const iconSizes = {
  XXS: 8,
  XS: 10,
  SMALL: 12,
  MEDIUM: 14,
  LARGE: 15,
  XL: 16,
  XXL: 18,
  XXXL: 20,
  XXXXL: 22,
};

type IconSizeType = typeof iconSizes;

export type ThemeBorder = {
  thickness: number;
  style: "dashed" | "solid";
  color: Color;
};

type PropertyPaneTheme = {
  width: number;
  height: number;
  dividerColor: Color;
  titleHeight: number;
  connectionsHeight: number;
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
  typography: Typography;
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
  bottomBarHeight: string;
  integrationsPageUnusableHeight: string;
  backBanner: string;
  homePage: any;
  sidebarWidth: string;
  canvasBottomPadding: number;
  navbarMenuHeight: string;
  navbarMenuLineHeight: string;
  actionsBottomTabInitialHeight: string;
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
      border: Color;
      background: Color;
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
  tabPanelHeight: number;
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
  actionSidePane: {
    width: number;
  };
  onboarding: {
    statusBarHeight: number;
  };
  settings: {
    footerHeight: number;
    footerShadow: string;
    linkBg: string;
  };
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

export const hideScrollbar = css`
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
    -webkit-appearance: none;
  }
`;

export const thinScrollbar = css`
  ::-webkit-scrollbar {
    width: 4px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    border-radius: 10px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 10px;
  }
  &:hover {
    ::-webkit-scrollbar-thumb {
      background: ${getColorWithOpacity(Colors.CHARCOAL, 0.5)};
      border-radius: 10px;
    }
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${getColorWithOpacity(Colors.CHARCOAL, 0.5)};
  }
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
  "#FFEFDB",
  "#D9E7FF",
  "#FFDEDE",
  "#E3DEFF",
  "#C7F3E3",
  "#F1DEFF",
  "#F4FFDE",
  "#C7F3F0",
  "#C2DAF0",
  "#F5D1D1",
  "#ECECEC",
  "#CCCCCC",
  "#F3F1C7",
  "#E4D8CC",
  "#EAEDFB",
  "#D6D1F2",
  "#FBF4ED",
  "#FFEBFB",
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
  "#157A96",
  "#090707",
  "#FFDEDE",
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
  "#6A86CE",
  "#E0DEDE",
  "#EBEBEB",
  "#858282",
  "#000000",
  "#F86A2B",
  "#FFDEDE",
  "#575757",
] as const;

type ShadeColor = typeof darkShades[number] | typeof lightShades[number];

type buttonVariant = {
  main: string;
  light: string;
  dark: string;
  darker: string;
  darkest: string;
};

type ButtonVariantColor = {
  primary: {
    bgColor?: Color;
    borderColor?: Color;
    hoverColor: Color;
    textColor: Color;
  };
  secondary: {
    bgColor?: Color;
    borderColor?: Color;
    hoverColor: Color;
    textColor: Color;
  };
  tertiary: {
    bgColor?: Color;
    borderColor?: Color;
    hoverColor: Color;
    textColor?: Color;
  };
};

type ColorType = {
  overlayColor: string;
  button: {
    disabledText: ShadeColor;
    boxShadow: {
      default: {
        variant1: Color;
        variant2: Color;
        variant3: Color;
        variant4: Color;
        variant5: Color;
      };
    };
    disabled: {
      bgColor: Color;
      textColor: Color;
    };
    /**
     * PRIMARY style
     */
    primary: ButtonVariantColor;

    /**
     * WARNING style
     */
    warning: ButtonVariantColor;
    /**
     * DANGER style
     */
    danger: ButtonVariantColor;
    /**
     * INFO style
     */
    info: ButtonVariantColor;
    /**
     * SECONDARY style
     */
    secondary: ButtonVariantColor;
    /**
     * CUSTOM style
     */
    custom: {
      solid: {
        dark: {
          textColor: Color;
        };
        light: {
          textColor: Color;
        };
      };
    };
    /**
     * LINK button style
     */
    link: {
      main: Color;
      hover: Color;
      active: Color;
      disabled: Color;
    };
  };
  tertiary: buttonVariant;
  info: buttonVariant;
  success: buttonVariant;
  warning: buttonVariant;
  danger: buttonVariant;
  homepageBackground: string;
  selected: ShadeColor;
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
  navigationMenu: {
    contentActive: string;
    backgroundActive: string;
    contentInactive: string;
    backgroundInactive: string;
    label: string;
    warning: string;
    warningBackground: string;
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
      defaultBg: ShadeColor;
      bg: ShadeColor;
      disabledBg: ShadeColor;
    };
    menu: {
      border: ShadeColor;
      bg: ShadeColor;
      hover: ShadeColor;
      text: ShadeColor;
      hoverText: ShadeColor;
      subText: ShadeColor;
    };
    menuShadow: string;
    selected: {
      text: ShadeColor;
      bg: ShadeColor;
      icon: ShadeColor;
      subtext?: ShadeColor;
    };
    hovered: {
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
    spinnerBg: ShadeColor;
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
    helper: ShadeColor;
    icon: ShadeColor;
    readOnly: {
      bg: ShadeColor;
      border: ShadeColor;
      text: ShadeColor;
    };
    hover: {
      bg: ShadeColor;
    };
    caretColor: string;
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
    icon: ShadeColor;
    hover: ShadeColor;
    border: ShadeColor;
    countBg: ShadeColor;
    selected: string;
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
    cardMenuIcon: ShadeColor;
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
    name: ShadeColor;
    userName: ShadeColor;
  };
  modal: {
    bg: ShadeColor;
    headerText: ShadeColor;
    iconColor: string;
    iconBg: ShadeColor;
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
    undoRedoColor: string;
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
    tabBg: ShadeColor;
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
  guidedTour: {
    runButton: string;
    cancelButton: {
      color: string;
      borderColor: string;
      hoverBackgroundColor: string;
    };
    endButton: {
      backgroundColor: string;
      borderColor: string;
      hoverBackgroundColor: string;
    };
    endTourButton: {
      color: string;
      hoverColor: string;
    };
    card: {
      borderBottom: string;
      background: string;
    };
    stepCountBackground: string;
  };
  globalSearch: {
    containerBackground: string;
    activeSearchItemBackground: string;
    activeCategory: string;
    searchInputText: string;
    containerShadow: string;
    separator: string;
    searchItemHighlight: string;
    searchItemAltText: string;
    searchItemText: string;
    searchItemSubText: string;
    highlightedTextUnderline: string;
    documentationCtaBackground: string;
    documentationCtaText: string;
    emptyStateText: string;
    navigateUsingEnterSection: string;
    codeBackground: string;
    documentationCodeBackground: string;
    documentLink: string;
    helpBarText: string;
    helpBarBackground: string;
    helpButtonBackground: string;
    helpIcon: string;
    sectionTitle: string;
    navigateToEntityEnterkey: string;
    primaryBgColor: string;
    primaryTextColor: string;
    secondaryTextColor: string;
    primaryBorderColor: string;
    defaultIconsColor: string;
    snippets: {
      refinementPillsColor: string;
      refinementPillsBg: string;
      filterListBackground: string;
      filterBtnText: string;
      codeContainerBorder: string;
    };
    searchInputBorder: string;
  };
  gif: {
    overlay: string;
    text: string;
    iconPath: string;
    iconCircle: string;
  };
  comments: {
    profileUserName: string;
    threadTitle: string;
    commentBody: string;
    profileImageBorder: string;
    mention: string;
    threadContainerBorder: string;
    addCommentInputBorder: string;
    sendButton: string;
    addCommentInputBackground: string;
    pin: string;
    activeModeBackground: string;
    activeModeIcon: string;
    modeIcon: string;
    emojiPicker: string;
    resolved: string;
    unresolved: string;
    resolvedFill: string;
    unresolvedFill: string;
    resolvedPath: string;
    childCommentsIndent: string;
    commentBackground: string;
    contextMenuTrigger: string;
    contextMenuItemHover: ShadeColor;
    contextMenuIcon: ShadeColor;
    contextMenuIconHover: ShadeColor;
    contextMenuIconStroke: ShadeColor;
    contextMenuIconStrokeHover: ShadeColor;
    contextMenuTitle: ShadeColor;
    contextMenuTitleHover: ShadeColor;
    appCommentsHeaderTitle: ShadeColor;
    appCommentsClose: ShadeColor;
    viewLatest: string;
    commentTime: string;
    pinId: string;
    commentsFilter: string;
    appCommentsHeaderBorder: string;
    unreadIndicator: string;
    unreadIndicatorCommentCard: string;
    pinnedByText: string;
    pinnedThreadBackground: string;
    visibleThreadBackground: string;
    cardOptionsIcon: string;
    appCommentsPlaceholderText: string;
    cardHoverBackground: string;
    introTitle: string;
    introContent: string;
    modeIconCircleStroke: string;
    activeModeIconCircleStroke: string;
  };
  mentionSuggestion: {
    nameText: string;
    usernameText: string;
    hover: string;
  };
  reactionsComponent: {
    reactionBackground: string;
    reactionBackgroundActive: string;
    text: string;
    textActive: string;
  };
  treeDropdown: {
    targetBg: string;
    targetIcon: {
      normal: string;
      hover: string;
    };
    menuShadow: string;
    menuBg: {
      normal: ShadeColor;
      hover: ShadeColor;
      selected: ShadeColor;
    };
    menuText: {
      normal: ShadeColor;
      hover: ShadeColor;
      selected: ShadeColor;
    };
  };
  propertyPane: {
    title: ShadeColor;
    bg: ShadeColor;
    label: ShadeColor;
    jsIconBg: ShadeColor;
    buttonBg: ShadeColor;
    buttonText: ShadeColor;
    radioGroupBg: ShadeColor;
    radioGroupText: ShadeColor;
    deleteIconColor: string;
    zoomButtonBG: ShadeColor;
    activeButtonText: ShadeColor;
    jsButtonHoverBG: ShadeColor;
    dropdownSelectBg: ShadeColor;
    multiDropdownBoxHoverBg: ShadeColor;
    iconColor: ShadeColor;
    ctaTextColor: string;
    ctaBackgroundColor: string;
    ctaLearnMoreTextColor: string;
    connections: {
      error: string;
      connectionsCount: ShadeColor;
      optionBg: string;
    };
  };
  scrollbar: string;
  scrollbarBG: string;
  debugger: {
    background: string;
    messageTextColor: string;
    time: string;
    label: string;
    entity: string;
    entityLink: string;
    evalDebugButton: {
      hover: string;
      active: string;
    };
    inspectElement: {
      color: string;
    };
    floatingButton: {
      background: string;
      color: string;
      shadow: string;
      errorCount: string;
      noErrorCount: string;
      warningCount: string;
    };
    blankState: {
      shortcut: string;
      color: string;
    };
    info: {
      borderBottom: string;
    };
    warning: {
      borderBottom: string;
      backgroundColor: string;
      iconColor: string;
      hoverIconColor: string;
    };
    error: {
      borderBottom: string;
      backgroundColor: string;
      iconColor: string;
      hoverIconColor: string;
    };
    jsonIcon: string;
    message: string;
  };
  helpModal: {
    itemHighlight: string;
    background: string;
  };
  mentionsInput: Record<string, string>;
  showcaseCarousel: Record<string, string>;
  displayImageUpload: Record<string, string>;
  notifications: Record<string, string>;
  widgetGroupingContextMenu: {
    border: string;
    actionActiveBg: string;
  };
  actionSidePane: {
    noConnections: string;
    noConnectionsText: string;
    connectionBorder: string;
    connectionHover: string;
    collapsibleIcon: string;
  };
  tabItemBackgroundFill: {
    highlightBackground: string;
    highlightTextColor: string;
    textColor: string;
  };
  pagesEditor: {
    iconColor: string;
  };
  numberedStep: {
    line: string;
  };
  gitSyncModal: GitSyncModalColors;
  editorBottomBar: {
    background: string;
    buttonBackgroundHover: string;
    branchBtnText: string;
  };
  link: string;
  welcomePage?: {
    text: string;
  };
  settings: {
    link: string;
  };
};

const editorBottomBar = {
  background: Colors.WHITE,
  buttonBackgroundHover: Colors.Gallery,
  branchBtnText: Colors.CHARCOAL,
};

const gitSyncModal = {
  menuBackgroundColor: Colors.ALABASTER_ALT,
  separator: Colors.ALTO2,
  closeIcon: "rgba(29, 28, 29, 0.7);",
};
type GitSyncModalColors = typeof gitSyncModal;

const tabItemBackgroundFill = {
  highlightBackground: Colors.Gallery,
  highlightTextColor: Colors.CODE_GRAY,
  textColor: Colors.CHARCOAL,
};

const notifications = {
  time: "#858282",
  listHeaderTitle: "#090707",
  markAllAsReadButtonBackground: "#f0f0f0",
  markAllAsReadButtonText: "#716E6E",
  unreadIndicator: "#F86A2B",
  bellIndicator: "#E22C2C",
  label: "#858282",
};

const displayImageUpload = {
  background: "#AEBAD9",
  label: "#457AE6",
};

const showcaseCarousel = {
  activeStepDot: "#F86A2B",
  inactiveStepDot: "#FEEDE5",
};

const reactionsComponent = {
  reactionBackground: lightShades[2],
  reactionBackgroundActive: "#FEEDE5",
  text: lightShades[7],
  textActive: "#BF4109",
  borderActive: "#BF4109",
};

const mentionSuggestion = {
  nameText: "#090707",
  usernameText: "#716E6E",
  hover: "#EBEBEB",
};

const pagesEditor = {
  iconColor: "#A2A6A8",
};

const comments = {
  introTitle: "#090707",
  introContent: "#716E6E",
  commentsFilter: "#6A86CE",
  profileUserName: darkShades[11],
  threadTitle: darkShades[8],
  commentBody: darkShades[8],
  profileImageBorder: Colors.JAFFA_DARK,
  mention: "#F86A2B",
  threadContainerBorder: lightShades[5],
  addCommentInputBorder: lightShades[13],
  sendButton: "#6A86CE",
  addCommentInputBackground: "#FAFAFA",
  pin: "#EF4141",
  activeModeBackground: "#090707",
  emojiPicker: lightShades[5],
  resolved: Colors.BLACK,
  unresolved: lightShades[5],
  resolvedFill: Colors.BLACK,
  unresolvedFill: "transparent",
  resolvedPath: Colors.WHITE,
  childCommentsIndent: lightShades[13],
  commentBackground: lightShades[2],
  contextMenuTrigger: darkShades[6],
  contextMenuItemHover: lightShades[2],
  contextMenuIcon: darkShades[6],
  contextMenuIconHover: darkShades[11],
  contextMenuIconStroke: darkShades[6],
  contextMenuIconStrokeHover: darkShades[11],
  contextMenuTitle: lightShades[8],
  contextMenuTitleHover: darkShades[11],
  appCommentsHeaderTitle: darkShades[11],
  appCommentsClose: lightShades[15],
  viewLatest: "#F86A2B",
  commentTime: lightShades[7],
  pinId: lightShades[8],
  appCommentsHeaderBorder: lightShades[3],
  unreadIndicator: "#E00D0D",
  unreadIndicatorCommentCard: "#F86A2B",
  pinnedByText: lightShades[7],
  pinnedThreadBackground: "#FFFAE9",
  visibleThreadBackground: "#FBEED0",
  cardOptionsIcon: "#777272",
  appCommentsPlaceholderText: lightShades[8],
  activeModeIcon: "#F0F0F0",
  modeIcon: "#6D6D6D",
  cardHoverBackground: "#FBEED0",
  modeIconCircleStroke: "#222222",
  activeModeIconCircleStroke: "#090707",
};

const auth = {
  background: lightShades[11],
  cardBackground: lightShades[0],
  btnPrimary: Colors.CRUSTA,
  inputBackground: lightShades[11],
  headingText: darkShades[11],
  link: Colors.CRUSTA,
  text: "#000",
  placeholder: lightShades[8],
  socialBtnText: "#000",
  socialBtnBorder: lightShades[13],
  socialBtnHighlight: lightShades[2],
};

const helpModal = {
  itemHighlight: "#231f20",
  background: "#262626",
};

const formMessage = {
  background: {
    danger: "rgba(226,44,44,0.08)",
    success: "#172320",
    warning: "rgba(224, 179, 14, 0.08)",
    lightSuccess: "#EFFFF4",
  },
  text: {
    danger: "#E22C2C",
    success: "#03B365",
    warning: "#E0B30E",
    lightSuccess: "#00693B",
  },
};

const globalSearch = {
  containerBackground:
    "linear-gradient(0deg, rgba(43, 43, 43, 0.9), rgba(43, 43, 43, 0.9)), linear-gradient(119.61deg, rgba(35, 35, 35, 0.01) 0.43%, rgba(49, 49, 49, 0.01) 100.67%);",
  activeSearchItemBackground: "#EBEBEB",
  activeCategory: "#090707",
  searchInputText: "#090707",
  searchInputBorder: "#F86A2B",
  containerShadow: "0px 0px 32px 8px rgba(0, 0, 0, 0.25)",
  separator: "#424242",
  searchItemHighlight: "#fff",
  searchItemAltText: "#fff",
  searchItemText: "#090707",
  searchItemSubText: "#4B4848;",
  highlightedTextUnderline: "#03B365",
  helpBarText: "#C2C2C2",
  documentationCtaBackground: "rgba(3, 179, 101, 0.1)",
  documentationCtaText: "#03B365",
  emptyStateText: "#A9A7A7",
  navigateUsingEnterSection: "white",
  codeBackground: "#ffffff",
  documentationCodeBackground: "#f0f0f0",
  documentLink: "#F86A2B",
  helpBarBackground: "#000",
  helpButtonBackground: "#000",
  helpIcon: "#D4D4D4",
  sectionTitle: "#716E6E",
  navigateToEntityEnterkey: "#090707",
  primaryBgColor: "#ffffff",
  primaryTextColor: "#090707",
  secondaryTextColor: "#4b4848",
  primaryBorderColor: "#E0DEDE",
  defaultIconsColor: "#716e6e",
  snippets: {
    refinementPillsColor: "#4b4848",
    refinementPillsBg: "white",
    filterListBackground: lightShades[0],
    filterBtnText: lightShades[8],
    filterBtnBg: "#FAFAFA",
    codeContainerBorder: "#E0DEDE",
  },
};

const mentionsInput = {
  suggestionsListBackground: "#fff",
  suggestionsListBorder: "rgba(0,0,0,0.15)",
  focusedItemBackground: "#cee4e5",
  itemBorderBottom: "#cee4e5",
  mentionBackground: "#cee4e5",
  mentionsInviteBtnPlusIcon: "#6A86CE",
};

const actionSidePane = {
  noConnections: "#f0f0f0",
  noConnectionsText: "#e0dede",
  connectionBorder: "rgba(0, 0, 0, 0.5)",
  connectionHover: "#6a86ce",
  collapsibleIcon: Colors.CODE_GRAY,
};
const navigationMenu = {
  contentActive: "#F0F0F0",
  backgroundActive: "#222222",
  contentInactive: "#858282",
  backgroundInactive: "#090707",
  label: "#A9A7A7",
  warning: "#EABB0C",
  warningBackground: "#3A3628",
};

const guidedTour = {
  runButton: "#f86a2b",
  cancelButton: {
    color: "#716e6e",
    borderColor: "#716e6e",
    hoverBackgroundColor: "#f1f1f1",
  },
  endButton: {
    backgroundColor: "#f22b2b",
    borderColor: "#f22b2b",
    hoverBackgroundColor: "#f34040",
  },
  endTourButton: {
    color: "#4b4848",
    hoverColor: "#928f8f",
  },
  card: {
    borderBottom: "#eeeeee",
    background: "#ffefdb",
  },
  stepCountBackground: "#090707",
};

const numberedStep = {
  line: Colors.ALTO2,
  number: Colors.BLACK,
};

export const dark: ColorType = {
  editorBottomBar,
  gitSyncModal,
  numberedStep,
  tabItemBackgroundFill,
  overlayColor: "#090707cc",
  notifications,
  displayImageUpload,
  showcaseCarousel,
  mentionSuggestion,
  reactionsComponent,
  mentionsInput,
  helpModal,
  globalSearch,
  comments,
  navigationMenu,
  selected: darkShades[10],
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
    boxShadow: {
      default: {
        variant1: Colors.BOX_SHADOW_DEFAULT_VARIANT1,
        variant2: Colors.BOX_SHADOW_DEFAULT_VARIANT2,
        variant3: Colors.BOX_SHADOW_DEFAULT_VARIANT3,
        variant4: Colors.BOX_SHADOW_DEFAULT_VARIANT4,
        variant5: Colors.BOX_SHADOW_DEFAULT_VARIANT5,
      },
    },
    disabled: {
      bgColor: Colors.GREY_1,
      textColor: Colors.GREY_4,
    },
    primary: {
      primary: {
        bgColor: Colors.GREEN,
        hoverColor: Colors.PRIMARY_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.GREEN,
        hoverColor: Colors.PRIMARY_OUTLINE_HOVER,
        textColor: Colors.GREEN,
      },
      tertiary: {
        hoverColor: Colors.PRIMARY_GHOST_HOVER,
      },
    },
    warning: {
      primary: {
        bgColor: Colors.WARNING_SOLID,
        hoverColor: Colors.WARNING_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.WARNING_SOLID,
        hoverColor: Colors.WARNING_OUTLINE_HOVER,
        textColor: Colors.WARNING_SOLID,
      },
      tertiary: {
        hoverColor: Colors.WARNING_GHOST_HOVER,
      },
    },
    danger: {
      primary: {
        bgColor: Colors.DANGER_SOLID,
        hoverColor: Colors.DANGER_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.DANGER_SOLID,
        hoverColor: Colors.DANGER_NO_SOLID_HOVER,
        textColor: Colors.DANGER_SOLID,
      },
      tertiary: {
        hoverColor: Colors.DANGER_NO_SOLID_HOVER,
      },
    },
    info: {
      primary: {
        bgColor: Colors.INFO_SOLID,
        hoverColor: Colors.INFO_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.INFO_SOLID,
        hoverColor: Colors.INFO_NO_SOLID_HOVER,
        textColor: Colors.INFO_SOLID,
      },
      tertiary: {
        hoverColor: Colors.INFO_NO_SOLID_HOVER,
      },
    },
    secondary: {
      primary: {
        bgColor: Colors.GRAY,
        hoverColor: Colors.CHARCOAL,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.GRAY,
        hoverColor: Colors.Gallery,
        textColor: Colors.GRAY,
      },
      tertiary: {
        hoverColor: Colors.MERCURY,
      },
    },
    custom: {
      solid: {
        dark: {
          textColor: Colors.CUSTOM_SOLID_DARK_TEXT_COLOR,
        },
        light: {
          textColor: Colors.WHITE,
        },
      },
    },
    link: {
      main: "#D4D4D4",
      hover: "#FFFFFF",
      active: "#2B2B2B",
      disabled: "#202021",
    },
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
      defaultBg: "#090707",
      bg: "#090707",
      disabledBg: darkShades[2],
    },
    menu: {
      border: darkShades[3],
      bg: darkShades[3],
      text: darkShades[9],
      hover: darkShades[4],
      hoverText: darkShades[9],
      subText: darkShades[9],
    },
    menuShadow: "0px 12px 28px -8px rgba(0, 0, 0, 0.75)",
    selected: {
      text: darkShades[9],
      bg: darkShades[4],
      icon: darkShades[8],
    },
    hovered: {
      text: darkShades[9],
      bg: darkShades[10],
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
    spinnerBg: darkShades[4],
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
    helper: darkShades[5],
    icon: darkShades[7],
    readOnly: {
      bg: darkShades[0],
      border: darkShades[0],
      text: darkShades[7],
    },
    hover: {
      bg: darkShades[0],
    },
    caretColor: Colors.WHITE,
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
    icon: darkShades[6],
    hover: darkShades[7],
    border: darkShades[3],
    countBg: darkShades[4],
    selected: Colors.CRUSTA,
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
    cardMenuIcon: darkShades[7],
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
    name: darkShades[10],
    userName: darkShades[7],
  },
  modal: {
    bg: darkShades[1],
    headerText: darkShades[9],
    iconColor: "#6D6D6D",
    iconBg: darkShades[12],
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
    shadow: "none",
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
    undoRedoColor: "#F8682B",
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
    tabBg: lightShades[10],
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
      hoverState: darkShades[10],
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
    borderColor: darkShades[7],
  },
  auth,
  formMessage,
  gif: {
    overlay: "#000000",
    text: "#d4d4d4",
    iconPath: "#2b2b2b",
    iconCircle: "#d4d4d4",
  },
  treeDropdown: {
    targetBg: "#090707",
    targetIcon: {
      normal: "#9F9F9F",
      hover: "#9F9F9F",
    },
    menuShadow: "0px 12px 28px -8px rgba(0, 0, 0, 0.75)",
    menuBg: {
      normal: darkShades[3],
      hover: darkShades[4],
      selected: darkShades[4],
    },
    menuText: {
      normal: darkShades[7],
      hover: darkShades[9],
      selected: darkShades[7],
    },
  },
  propertyPane: {
    title: darkShades[11],
    bg: darkShades[1],
    label: darkShades[7],
    jsIconBg: darkShades[5],
    buttonBg: darkShades[7],
    buttonText: lightShades[10],
    radioGroupBg: darkShades[0],
    radioGroupText: darkShades[7],
    deleteIconColor: "#A3B3BF",
    zoomButtonBG: darkShades[3],
    activeButtonText: lightShades[12],
    jsButtonHoverBG: darkShades[2],
    dropdownSelectBg: darkShades[2],
    multiDropdownBoxHoverBg: darkShades[0],
    iconColor: darkShades[5],
    ctaTextColor: "#202223",
    ctaBackgroundColor: "rgb(248, 106, 43, 0.1)",
    ctaLearnMoreTextColor: "#f86a2b",
    connections: {
      error: "#f22b2b",
      connectionsCount: darkShades[11],
      optionBg: "rgba(246,71,71, 0.2)",
    },
  },
  scrollbar: getColorWithOpacity(Colors.LIGHT_GREY, 0.5),
  scrollbarBG: getColorWithOpacity(Colors.CODE_GRAY, 0.5),
  debugger: {
    background: darkShades[11],
    messageTextColor: "#D4D4D4",
    time: "#D4D4D4",
    label: "#D4D4D4",
    entity: "rgba(212, 212, 212, 0.5)",
    entityLink: "#D4D4D4",
    jsonIcon: "#9F9F9F",
    message: "#D4D4D4",
    evalDebugButton: {
      hover: "#fafafaaa",
      active: "#fafafaff",
    },
    floatingButton: {
      background: "#2b2b2b",
      color: "#d4d4d4",
      shadow: "0px 12px 28px -6px rgba(0, 0, 0, 0.32)",
      errorCount: "#F22B2B",
      noErrorCount: "#03B365",
      warningCount: "#DCAD00",
    },
    inspectElement: {
      color: "#D4D4D4",
    },
    blankState: {
      color: "#D4D4D4",
      shortcut: "#D4D4D4",
    },
    info: {
      borderBottom: "black",
    },
    warning: {
      iconColor: "#f3cc3e",
      hoverIconColor: "#e0b30e",
      borderBottom: "black",
      backgroundColor: "#29251A",
    },
    error: {
      iconColor: "#f56060",
      hoverIconColor: "#F22B2B",
      borderBottom: "black",
      backgroundColor: "#291B1D",
    },
  },
  guidedTour,
  widgetGroupingContextMenu: {
    border: "#69b5ff",
    actionActiveBg: "#e1e1e1",
  },
  actionSidePane,
  pagesEditor,
  link: "#f86a2b",
  welcomePage: {
    text: lightShades[5],
  },
  settings: {
    link: "#716E6E",
  },
};

export const light: ColorType = {
  editorBottomBar,
  gitSyncModal,
  numberedStep,
  tabItemBackgroundFill,
  overlayColor: "#090707cc",
  notifications,
  displayImageUpload,
  showcaseCarousel,
  mentionSuggestion,
  reactionsComponent,
  mentionsInput,
  helpModal: {
    itemHighlight: "#EBEBEB",
    background: "#FFFFFF",
  },
  globalSearch: {
    ...globalSearch,
    helpBarBackground: "#F0F0F0",
    helpBarText: "#A9A7A7",
    helpButtonBackground: "#F0F0F0",
    helpIcon: "#939090",
  },
  comments: {
    ...comments,
    activeModeBackground: "#EBEBEB",
    activeModeIcon: "#4B4848",
    modeIcon: "#858282",
    modeIconCircleStroke: "#fff",
    activeModeIconCircleStroke: "#EBEBEB",
  },
  navigationMenu: {
    contentActive: "#090707",
    backgroundActive: "#EBEBEB",
    contentInactive: "#4B4848",
    backgroundInactive: "#FFFFFF",
    label: "#A9A7A7",
    warning: "#F22B2B",
    warningBackground: "#FFFFFF",
  },
  selected: lightShades[12],
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
    disabledText: lightShades[15],
    boxShadow: {
      default: {
        variant1: Colors.BOX_SHADOW_DEFAULT_VARIANT1,
        variant2: Colors.BOX_SHADOW_DEFAULT_VARIANT2,
        variant3: Colors.BOX_SHADOW_DEFAULT_VARIANT3,
        variant4: Colors.BOX_SHADOW_DEFAULT_VARIANT4,
        variant5: Colors.BOX_SHADOW_DEFAULT_VARIANT5,
      },
    },
    disabled: {
      bgColor: Colors.GREY_1,
      textColor: Colors.GREY_4,
    },
    primary: {
      primary: {
        bgColor: Colors.GREEN,
        hoverColor: Colors.PRIMARY_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.GREEN,
        hoverColor: Colors.PRIMARY_OUTLINE_HOVER,
        textColor: Colors.GREEN,
      },
      tertiary: {
        hoverColor: Colors.PRIMARY_GHOST_HOVER,
      },
    },
    warning: {
      primary: {
        bgColor: Colors.WARNING_SOLID,
        hoverColor: Colors.WARNING_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.WARNING_SOLID,
        hoverColor: Colors.WARNING_OUTLINE_HOVER,
        textColor: Colors.WARNING_SOLID,
      },
      tertiary: {
        hoverColor: Colors.WARNING_GHOST_HOVER,
      },
    },
    danger: {
      primary: {
        bgColor: Colors.DANGER_SOLID,
        hoverColor: Colors.DANGER_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.DANGER_SOLID,
        hoverColor: Colors.DANGER_NO_SOLID_HOVER,
        textColor: Colors.DANGER_SOLID,
      },
      tertiary: {
        hoverColor: Colors.DANGER_NO_SOLID_HOVER,
      },
    },
    info: {
      primary: {
        bgColor: Colors.INFO_SOLID,
        hoverColor: Colors.INFO_SOLID_HOVER,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.INFO_SOLID,
        hoverColor: Colors.INFO_NO_SOLID_HOVER,
        textColor: Colors.INFO_SOLID,
      },
      tertiary: {
        hoverColor: Colors.INFO_NO_SOLID_HOVER,
      },
    },
    secondary: {
      primary: {
        bgColor: Colors.GRAY,
        hoverColor: Colors.CHARCOAL,
        textColor: Colors.WHITE,
      },
      secondary: {
        borderColor: Colors.GRAY,
        hoverColor: Colors.Gallery,
        textColor: Colors.GRAY,
      },
      tertiary: {
        hoverColor: Colors.MERCURY,
      },
    },
    custom: {
      solid: {
        dark: {
          textColor: Colors.CUSTOM_SOLID_DARK_TEXT_COLOR,
        },
        light: {
          textColor: Colors.WHITE,
        },
      },
    },
    link: {
      main: "#716E6E",
      hover: "#090707",
      active: "#4B4848",
      disabled: "#858282",
    },
  },
  tertiary: {
    main: "#606065",
    light: "#090707",
    dark: "#FAFAFA",
    darker: "#EDEDED",
    darkest: "#A9A7A7",
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
    darker: "#CBF4E2",
    darkest: "#D9FDED",
  },
  warning: {
    main: "#FEB811",
    light: "#EFA903",
    dark: "#EFA903",
    darker: "#FBEED0",
    darkest: "#FFFAE9",
  },
  danger: {
    main: "#F22B2B",
    light: "#B90707",
    dark: "#C60707",
    darker: "#FDE4E4",
    darkest: "#FFE9E9",
  },
  homepageBackground: "#ffffff",
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
    checkmark: lightShades[16],
  },
  checkbox: {
    disabled: lightShades[3],
    unchecked: lightShades[5],
    disabledCheck: lightShades[6],
    normalCheck: lightShades[11],
    labelColor: lightShades[9],
  },
  dropdown: {
    header: {
      text: lightShades[8],
      disabledText: darkShades[6],
      defaultBg: lightShades[11],
      bg: lightShades[14],
      disabledBg: lightShades[1],
    },
    menu: {
      border: lightShades[13],
      bg: lightShades[0],
      text: lightShades[8],
      hover: lightShades[2],
      hoverText: lightShades[10],
      subText: lightShades[15],
    },
    menuShadow: "0px 6px 20px rgba(0, 0, 0, 0.15)",
    selected: {
      text: lightShades[10],
      bg: lightShades[14],
      icon: lightShades[15],
      subtext: lightShades[7],
    },
    hovered: {
      text: lightShades[10],
      bg: lightShades[14],
      icon: lightShades[11],
    },
    icon: lightShades[7],
  },
  toggle: {
    bg: lightShades[13],
    hover: {
      on: "#BF4109",
      off: lightShades[5],
    },
    disable: {
      on: "#FEEDE5",
      off: lightShades[13],
    },
    disabledSlider: {
      off: lightShades[11],
      on: lightShades[11],
    },
    spinner: lightShades[5],
    spinnerBg: lightShades[3],
  },
  textInput: {
    disable: {
      bg: lightShades[2],
      text: darkShades[5],
      border: lightShades[2],
    },
    normal: {
      bg: lightShades[11],
      text: lightShades[10],
      border: lightShades[13],
    },
    placeholder: lightShades[5],
    helper: lightShades[15],
    icon: lightShades[7],
    readOnly: {
      bg: lightShades[2],
      border: lightShades[2],
      text: lightShades[7],
    },
    hover: {
      bg: lightShades[0],
    },
    caretColor: Colors.BLACK,
  },
  menuBorder: lightShades[3],
  editableText: {
    color: lightShades[8],
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
    border: lightShades[13],
    bg: lightShades[11],
    icon: {
      focused: lightShades[10],
      normal: lightShades[7],
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
    normal: lightShades[15],
    icon: lightShades[10],
    hover: lightShades[8],
    border: lightShades[3],
    countBg: lightShades[3],
    selected: Colors.CRUSTA,
  },
  settingHeading: lightShades[16],
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
    cardMenuIcon: lightShades[17],
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
    bg: lightShades[11],
    color: lightShades[8],
  },
  profileDropdown: {
    name: lightShades[10],
    userName: lightShades[7],
  },
  modal: {
    bg: lightShades[11],
    headerText: lightShades[10],
    iconColor: lightShades[5],
    iconBg: lightShades[18],
    user: {
      textColor: lightShades[9],
    },
    email: {
      message: lightShades[9],
      desc: lightShades[7],
    },
    manageUser: lightShades[19],
    scrollbar: lightShades[5],
    separator: lightShades[4],
    title: lightShades[8],
    link: "#F86A2B",
    hoverState: lightShades[3],
  },
  tagInput: {
    bg: lightShades[11],
    tag: {
      text: lightShades[11],
    },
    text: lightShades[9],
    placeholder: darkShades[7],
    shadow: "none",
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
    undoRedoColor: "#F8682B",
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
    tabBg: lightShades[11],
    text: lightShades[16],
    dividerBg: lightShades[13],
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
    closeIcon: lightShades[10],
    responseBody: {
      bg: lightShades[11],
    },
    codeEditor: {
      placeholderColor: lightShades[15],
    },
    body: {
      text: "#A9A7A7",
    },
    settings: {
      textColor: lightShades[10],
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
      defaultState: lightShades[0],
      hoverState: lightShades[12],
    },
    text: "#090707",
    dataType: {
      shortForm: "#858282",
      fullForm: "#6D6D6D",
    },
  },
  floatingBtn: {
    tagBackground: "#e22c2c",
    backgroundColor: lightShades[0],
    iconColor: lightShades[7],
    borderColor: lightShades[14],
  },
  auth,
  formMessage,
  gif: {
    overlay: "#ffffff",
    text: "#6f6f6f",
    iconPath: "#c4c4c4",
    iconCircle: "#090707",
  },
  treeDropdown: {
    targetBg: "#FFFFFF",
    targetIcon: {
      normal: "#939090",
      hover: "#4B4848",
    },
    menuShadow:
      "0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1)",
    menuBg: {
      normal: lightShades[0],
      hover: lightShades[12],
      selected: lightShades[3],
    },
    menuText: {
      normal: lightShades[8],
      hover: lightShades[0],
      selected: lightShades[8],
    },
  },
  propertyPane: {
    title: darkShades[11],
    bg: lightShades[2],
    label: lightShades[8],
    jsIconBg: lightShades[5],
    buttonBg: lightShades[8],
    buttonText: lightShades[11],
    radioGroupBg: lightShades[0],
    radioGroupText: lightShades[8],
    deleteIconColor: "#A3B3BF",
    zoomButtonBG: lightShades[13],
    activeButtonText: lightShades[12],
    jsButtonHoverBG: lightShades[2],
    dropdownSelectBg: lightShades[14],
    multiDropdownBoxHoverBg: lightShades[11],
    iconColor: lightShades[5],
    ctaTextColor: "#202223",
    ctaBackgroundColor: "rgb(248, 106, 43, 0.1)",
    ctaLearnMoreTextColor: "#f86a2b",
    connections: {
      error: "#f22b2b",
      connectionsCount: darkShades[11],
      optionBg: "rgba(246,71,71, 0.2)",
    },
  },
  scrollbar: getColorWithOpacity(Colors.CHARCOAL, 0.5),
  scrollbarBG: "transparent",
  debugger: {
    background: "#FFFFFF",
    messageTextColor: "#716e6e",
    time: "#4b4848",
    label: "#4b4848",
    entity: "rgba(75, 72, 72, 0.7)",
    entityLink: "#6d6d6d",
    jsonIcon: "#a9a7a7",
    message: "#4b4848",
    evalDebugButton: {
      hover: "#fafafaaa",
      active: "#fafafaff",
    },
    floatingButton: {
      background: "#2b2b2b",
      color: "#d4d4d4",
      shadow: "0px 12px 28px -6px rgba(0, 0, 0, 0.32)",
      errorCount: "#F22B2B",
      noErrorCount: "#03B365",
      warningCount: "#DCAD00",
    },
    inspectElement: {
      color: "#090707",
    },
    blankState: {
      color: "#090707",
      shortcut: "black",
    },
    info: {
      borderBottom: "rgba(0, 0, 0, 0.05)",
    },
    warning: {
      iconColor: "#f3cc3e",
      hoverIconColor: "#e0b30e",
      borderBottom: "white",
      backgroundColor: "rgba(254, 184, 17, 0.1)",
    },
    error: {
      iconColor: "#f56060",
      hoverIconColor: "#F22B2B",
      borderBottom: "white",
      backgroundColor: "rgba(242, 43, 43, 0.08)",
    },
  },
  guidedTour,
  widgetGroupingContextMenu: {
    border: "#69b5ff",
    actionActiveBg: "#e1e1e1",
  },
  actionSidePane,
  pagesEditor,
  link: "#f86a2b",
  welcomePage: {
    text: lightShades[5],
  },
  settings: {
    link: "#716E6E",
  },
};

export const theme: Theme = {
  radii: [0, 4, 8, 10, 20, 50],
  fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
  spaces: [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36, 38, 40, 42, 44],
  fontWeights: [0, 400, 500, 700],
  typography: typography,
  iconSizes: iconSizes,
  propertyPane: {
    width: 270,
    titleHeight: 40,
    connectionsHeight: 30,
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
      lightText: lightShades[10],
      darkBg: lightShades[10],
      darkText: lightShades[0],
    },
    appBackground: "#EDEDED",
    artboard: "#F6F6F6",
    primaryOld: Colors.GREEN,
    primaryDarker: Colors.JUNGLE_GREEN,
    primaryDarkest: Colors.JUNGLE_GREEN_DARKER,
    secondary: Colors.GEYSER_LIGHT,
    secondaryDarker: Colors.CONCRETE,
    secondaryDarkest: Colors.MERCURY,
    error: Colors.ERROR_RED,
    infoOld: Colors.SLATE_GRAY,
    errorMessage: Colors.ERROR_RED,
    hover: Colors.POLAR,
    inputActiveBorder: Colors.HIT_GRAY,
    inputInactiveBG: Colors.AQUA_HAZE,
    textDefault: Colors.BLACK_PEARL,
    textOnDarkBG: Colors.WHITE,
    textOnGreyBG: Colors.CHARCOAL,
    textOnWhiteBG: Colors.CODE_GRAY,
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
    grid: Colors.ALTO2,
    containerBorder: Colors.FRENCH_PASS,
    menuButtonBGInactive: Colors.JUNGLE_MIST,
    menuIconColorInactive: Colors.OXFORD_BLUE,
    bodyBG: Colors.ATHENS_GRAY,
    builderBodyBG: Colors.WHITE,
    widgetMultiSelectBorder: Colors.MALIBU,
    widgetBorder: Colors.SLATE_GRAY,
    widgetLightBorder: Colors.WHITE_SMOKE,
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
    scrollbarLight: getColorWithOpacity(Colors.CHARCOAL, 0.5),
    scrollbarLightBG: getColorWithOpacity(Colors.WHITE, 0.5),
    scrollbarDark: getColorWithOpacity(Colors.LIGHT_GREY, 0.5),
    scrollbarDarkBG: getColorWithOpacity(Colors.CODE_GRAY, 0.5),
    dropdownIconBg: Colors.ALTO2,
    welcomeTourStickySidebarColor: Colors.WHITE,
    welcomeTourStickySidebarBackground: "#F86A2B",
    dropdownIconDarkBg: Colors.DARK_GRAY,
    dropdownGreyBg: Colors.Gallery,
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
  sidebarWidth: "250px",
  homePage: {
    header: 48,
    leftPane: {
      width: 240,
      leftPadding: 16,
      rightMargin: 12,
    },
    main: {
      marginLeft: 112,
    },
    search: {
      height: 68,
      paddingTop: 30,
    },
    sidebar: 256,
  },
  headerHeight: "48px",
  smallHeaderHeight: "32px",
  bottomBarHeight: "34px",
  integrationsPageUnusableHeight: "182px",
  backBanner: "30px",
  canvasBottomPadding: 200,
  navbarMenuHeight: "35px",
  navbarMenuLineHeight: "25px",
  sideNav: {
    maxWidth: 220,
    minWidth: 50,
    bgColor: Colors.OXFORD_BLUE,
    fontColor: Colors.WHITE,
    activeItemBGColor: Colors.SHARK,
    navItemHeight: 42,
  },
  card: {
    minWidth: 228,
    minHeight: 124,
    titleHeight: 48,
    divider: {
      thickness: 1,
      style: "solid",
      color: Colors.GEYSER_LIGHT,
    },
  },
  dropdown: {
    [Skin.LIGHT]: {
      hoverBG: lightShades[2],
      hoverText: lightShades[10],
      inActiveBG: lightShades[2],
      inActiveText: lightShades[10],
      border: Colors.WHITE,
      background: Colors.WHITE,
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
  tabPanelHeight: 34,
  actionsBottomTabInitialHeight: "40%",
  alert: {
    info: {
      color: Colors.AZURE_RADIANCE,
    },
    success: {
      color: Colors.OCEAN_GREEN,
    },
    error: {
      color: Colors.ERROR_RED,
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
  actionSidePane: {
    width: 265,
  },
  onboarding: {
    statusBarHeight: 83,
  },
  settings: {
    footerHeight: 84,
    footerShadow: "0px 0px 18px -6px rgb(0, 0, 0, 0.25)",
    linkBg: lightShades[2],
  },
};

export { css, createGlobalStyle, keyframes, ThemeProvider };

export default styled;
