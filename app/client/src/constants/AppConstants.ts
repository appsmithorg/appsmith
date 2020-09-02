export const CANVAS_DEFAULT_WIDTH_PX = 1242;
export const CANVAS_DEFAULT_HEIGHT_PX = 1292;
export const CANVAS_DEFAULT_GRID_HEIGHT_PX = 1;
export const CANVAS_DEFAULT_GRID_WIDTH_PX = 1;
export const CANVAS_BACKGROUND_COLOR = "#FFFFFF";

export const appCardColors = [
  "#4F70FD",
  "#54A9FB",
  "#5ED3DA",
  "#F56AF4",
  "#F36380",
  "#FE9F44",
  "#E9C951",
  "#A8D76C",
  "#6C4CF1",
];

const APP_STORE_NAMESPACE = "APPSMITH_LOCAL_STORE";

export const getAppStoreName = (appId: string) =>
  `${APP_STORE_NAMESPACE}-${appId}`;
