import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import { calculateDynamicHeight } from "utils/DSLMigrations";
import { getMainCanvasProps } from "./editorSelectors";

export const getIsCanvasInitialized = (state: AppState) => {
  return state.ui.mainCanvas.initialized;
};

export const getMainCanvasCalculatedMinHeight = createSelector(
  getWidgets,
  getMainCanvasProps,
  (canvasWidgets, mainCanvasProps) => {
    return calculateDynamicHeight(canvasWidgets, mainCanvasProps?.height);
  },
);
