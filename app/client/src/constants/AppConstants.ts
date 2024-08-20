import localStorage from "utils/localStorage";
import { GridDefaults } from "./WidgetConstants";
import { APP_MAX_WIDTH, type AppMaxWidth } from "@appsmith/wds-theming";

export const CANVAS_DEFAULT_MIN_HEIGHT_PX = 380;
export const CANVAS_DEFAULT_MIN_ROWS = Math.ceil(
  CANVAS_DEFAULT_MIN_HEIGHT_PX / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
);
export const DEFAULT_ENTITY_EXPLORER_WIDTH = 256;
export const DEFAULT_PROPERTY_PANE_WIDTH = 288;
export const APP_SETTINGS_PANE_WIDTH = 525;
export const DEFAULT_EXPLORER_PANE_WIDTH = 255;
export const SPLIT_SCREEN_RATIO = 0.404;

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

export const TOOLTIP_HOVER_ON_DELAY_IN_S = 1;

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
  COLOR_STYLE: {
    LIGHT: "light",
    THEME: "theme",
  },
  LOGO_ASSET_ID: "",
  LOGO_CONFIGURATION: {
    LOGO_AND_APPLICATION_TITLE: "logoAndApplicationTitle",
    LOGO_ONLY: "logoOnly",
    APPLICATION_TITLE_ONLY: "applicationTitleOnly",
    NO_LOGO_OR_APPLICATION_TITLE: "noLogoOrApplicationTitle",
  },
};

export interface NavigationSetting {
  showNavbar: boolean;
  showSignIn: boolean;
  orientation: (typeof NAVIGATION_SETTINGS.ORIENTATION)[keyof typeof NAVIGATION_SETTINGS.ORIENTATION];
  navStyle: (typeof NAVIGATION_SETTINGS.NAV_STYLE)[keyof typeof NAVIGATION_SETTINGS.NAV_STYLE];
  position: (typeof NAVIGATION_SETTINGS.POSITION)[keyof typeof NAVIGATION_SETTINGS.POSITION];
  colorStyle: (typeof NAVIGATION_SETTINGS.COLOR_STYLE)[keyof typeof NAVIGATION_SETTINGS.COLOR_STYLE];
  logoAssetId: string;
  logoConfiguration: (typeof NAVIGATION_SETTINGS.LOGO_CONFIGURATION)[keyof typeof NAVIGATION_SETTINGS.LOGO_CONFIGURATION];
}

export interface ThemeSetting {
  accentColor: string;
  colorMode: "LIGHT" | "DARK";
  borderRadius: string;
  density: number;
  sizing: number;
  fontFamily: string;
  iconStyle: "FILLED" | "OUTLINED";
  appMaxWidth: AppMaxWidth;
}

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
  logoAssetId: "logoAssetId",
  logoConfiguration: "logoConfiguration",
};

export const defaultNavigationSetting = {
  showNavbar: true,
  showSignIn: true,
  orientation: NAVIGATION_SETTINGS.ORIENTATION.TOP,
  navStyle: NAVIGATION_SETTINGS.NAV_STYLE.STACKED,
  position: NAVIGATION_SETTINGS.POSITION.STATIC,
  colorStyle: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
  logoAssetId: NAVIGATION_SETTINGS.LOGO_ASSET_ID,
  logoConfiguration:
    NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
};

export const defaultThemeSetting: ThemeSetting = {
  fontFamily: "System Default",
  accentColor: "#0080ff",
  colorMode: "LIGHT",
  borderRadius: "6px",
  density: 1,
  sizing: 1,
  iconStyle: "OUTLINED",
  appMaxWidth: APP_MAX_WIDTH.Large,
};

export const SIDEBAR_WIDTH = {
  REGULAR: 270,
  MINIMAL: 66,
};

export const APP_SIDEBAR_WIDTH = 50;

export const APPLICATION_TITLE_MAX_WIDTH = 192;
export const APPLICATION_TITLE_MAX_WIDTH_MOBILE = 150;
//all values are in milliseconds
export const REQUEST_IDLE_CALLBACK_TIMEOUT = {
  highPriority: 1500,
  lowPriority: 3000,
};
