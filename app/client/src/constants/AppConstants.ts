export const CANVAS_DEFAULT_WIDTH_PX = 1242;
export const CANVAS_DEFAULT_HEIGHT_PX = 1292;
export const CANVAS_DEFAULT_GRID_HEIGHT_PX = 1;
export const CANVAS_DEFAULT_GRID_WIDTH_PX = 1;
export const CANVAS_BACKGROUND_COLOR = "#FFFFFF";

const APP_STORE_NAMESPACE = "APPSMITH_LOCAL_STORE";

export const getAppStoreName = (appId: string) =>
  `${APP_STORE_NAMESPACE}-${appId}`;
