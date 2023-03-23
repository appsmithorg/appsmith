import localStorage from "utils/localStorage";
import { GridDefaults } from "./WidgetConstants";

export const CANVAS_DEFAULT_HEIGHT_PX = 1292;
export const CANVAS_DEFAULT_MIN_HEIGHT_PX = 380;
export const CANVAS_DEFAULT_GRID_HEIGHT_PX = 1;
export const CANVAS_DEFAULT_GRID_WIDTH_PX = 1;
export const CANVAS_DEFAULT_MIN_ROWS = Math.ceil(
  CANVAS_DEFAULT_MIN_HEIGHT_PX / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
);
export const CANVAS_BACKGROUND_COLOR = "#FFFFFF";
export const DEFAULT_ENTITY_EXPLORER_WIDTH = 256;
export const DEFAULT_PROPERTY_PANE_WIDTH = 288;
export const APP_SETTINGS_PANE_WIDTH = 525;

const APP_STORE_NAMESPACE = "APPSMITH_LOCAL_STORE";

export const getAppStoreName = (appId: string, branch?: string) =>
  branch
    ? `${APP_STORE_NAMESPACE}-${appId}-${branch}`
    : `${APP_STORE_NAMESPACE}-${appId}`;

export const getPersistentAppStore = (appId: string, branch?: string) => {
  const appStoreName = getAppStoreName(appId, branch);
  let storeString = "{}";
  // Check if localStorage exists
  if (localStorage.isSupported()) {
    const appStore = localStorage.getItem(appStoreName);
    if (appStore) storeString = appStore;
  }
  let store;
  try {
    store = JSON.parse(storeString);
  } catch (e) {
    store = {};
  }
  return store;
};

export const TOOLTIP_HOVER_ON_DELAY = 1000;

export const MOBILE_MAX_WIDTH = 767;
export const TABLET_MIN_WIDTH = 768;
export const TABLET_MAX_WIDTH = 991;
export const DESKTOP_MIN_WIDTH = 992;

export const NAVIGATION_SETTINGS = {
  ORIENTATION: {
    TOP: "top",
    SIDE: "side",
  },
  NAV_STYLE: {
    STACKED: "stacked",
    INLINE: "inline",
    SIDEBAR: "sidebar",
    MINIMAL: "minimal",
  },
  POSITION: {
    STATIC: "static",
    STICKY: "sticky",
  },
  ITEM_STYLE: {
    TEXT_ICON: "textIcon",
    TEXT: "text",
    ICON: "icon",
  },
  COLOR_STYLE: {
    LIGHT: "light",
    THEME: "theme",
  },
  LOGO_CONFIGURATION: {
    LOGO_AND_APPLICATION_TITLE: "logoAndApplicationTitle",
    LOGO_ONLY: "logoOnly",
    APPLICATION_TITLE_ONLY: "applicationTitleOnly",
    NO_LOGO_OR_APPLICATION_TITLE: "noLogoOrApplicationTitle",
  },
};

export type NavigationSetting = {
  showNavbar: boolean;
  showSignIn: boolean;
  orientation: (typeof NAVIGATION_SETTINGS.ORIENTATION)[keyof typeof NAVIGATION_SETTINGS.ORIENTATION];
  navStyle: (typeof NAVIGATION_SETTINGS.NAV_STYLE)[keyof typeof NAVIGATION_SETTINGS.NAV_STYLE];
  position: (typeof NAVIGATION_SETTINGS.POSITION)[keyof typeof NAVIGATION_SETTINGS.POSITION];
  itemStyle: (typeof NAVIGATION_SETTINGS.ITEM_STYLE)[keyof typeof NAVIGATION_SETTINGS.ITEM_STYLE];
  colorStyle: (typeof NAVIGATION_SETTINGS.COLOR_STYLE)[keyof typeof NAVIGATION_SETTINGS.COLOR_STYLE];
  logoConfiguration: (typeof NAVIGATION_SETTINGS.LOGO_CONFIGURATION)[keyof typeof NAVIGATION_SETTINGS.LOGO_CONFIGURATION];
};

export type StringsFromNavigationSetting = Omit<
  NavigationSetting,
  "showNavbar" | "showSignIn"
>;

export const keysOfNavigationSetting = {
  showNavbar: "showNavbar",
  showSignIn: "showSignIn",
  orientation: "orientation",
  navStyle: "navStyle",
  position: "position",
  itemStyle: "itemStyle",
  colorStyle: "colorStyle",
  logoConfiguration: "logoConfiguration",
};

export const defaultNavigationSetting = {
  showNavbar: true,
  showSignIn: true,
  orientation: NAVIGATION_SETTINGS.ORIENTATION.TOP,
  navStyle: NAVIGATION_SETTINGS.NAV_STYLE.STACKED,
  position: NAVIGATION_SETTINGS.POSITION.STATIC,
  itemStyle: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT,
  colorStyle: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
  logoConfiguration:
    NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
};

export const SIDEBAR_WIDTH = {
  REGULAR: 270,
  MINIMAL: 66,
};

export const APPLICATION_TITLE_MAX_WIDTH = 224;
export const APPLICATION_TITLE_MAX_WIDTH_MOBILE = 150;
//all values are in milliseconds
export const REQUEST_IDLE_CALLBACK_TIMEOUT = {
  highPriority: 1500,
  lowPriority: 3000,
};
