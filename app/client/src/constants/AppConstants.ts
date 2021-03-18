import localStorage from "utils/localStorage";

export const CANVAS_DEFAULT_HEIGHT_PX = 1292;
export const CANVAS_DEFAULT_GRID_HEIGHT_PX = 1;
export const CANVAS_DEFAULT_GRID_WIDTH_PX = 1;
export const CANVAS_BACKGROUND_COLOR = "#FFFFFF";

const APP_STORE_NAMESPACE = "APPSMITH_LOCAL_STORE";

export const getAppStoreName = (appId: string) =>
  `${APP_STORE_NAMESPACE}-${appId}`;

export const getAppStore = (appId: string) => {
  const appStoreName = getAppStoreName(appId);
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
