import { AppState } from "@appsmith/reducers";

export const getIsDraggingForSelection = (state: AppState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};
