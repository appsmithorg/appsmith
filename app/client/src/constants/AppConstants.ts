import localStorage from "utils/localStorage";

export const CANVAS_DEFAULT_HEIGHT_PX = 1292;
export const CANVAS_DEFAULT_GRID_HEIGHT_PX = 1;
export const CANVAS_DEFAULT_GRID_WIDTH_PX = 1;
export const CANVAS_BACKGROUND_COLOR = "#FFFFFF";
export const DEFAULT_ENTITY_EXPLORER_WIDTH = 256;
export const DEFAULT_PROPERTY_PANE_WIDTH = 256;

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
