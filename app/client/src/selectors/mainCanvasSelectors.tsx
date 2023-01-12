import { AppState } from "@appsmith/reducers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import store from "store";

export const getIsCanvasInitialized = (state: AppState) => {
  return state.ui.mainCanvas.initialized;
};

export const getIsMobile = (state: AppState) => state.ui.mainCanvas.isMobile;

export const getUseAutoLayout = (state: AppState) =>
  state.entities.canvasWidgets[MAIN_CONTAINER_WIDGET_ID].useAutoLayout;

export function isAutoLayout() {
  const appState = store.getState();
  return !!getUseAutoLayout(appState);
}
