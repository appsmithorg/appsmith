import { LayoutSystemTypes } from "reducers/entityReducers/pageListReducer";
import { createSelector } from "reselect";
import { getCurrentLayoutSystemType } from "./editorSelectors";
import type { AppState } from "@appsmith/reducers";

export const getIsDraggingForSelection = (state: AppState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};

export const getIsAutoLayout = createSelector(
  getCurrentLayoutSystemType,
  (layoutSystemType: LayoutSystemTypes): boolean => {
    return layoutSystemType === LayoutSystemTypes.AUTO;
  },
);
