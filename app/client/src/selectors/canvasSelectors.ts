import { AppState } from "reducers";

export const getIsDraggingForSelection = (state: AppState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};
