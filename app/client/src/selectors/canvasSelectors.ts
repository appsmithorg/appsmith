import { LayoutSystemTypes } from "layoutSystems/types";
import { createSelector } from "reselect";
import type { AppState } from "ee/reducers";
import { getLayoutSystemType } from "./layoutSystemSelectors";

export const getIsDraggingForSelection = (state: AppState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};

export const getIsAutoLayout = createSelector(
  getLayoutSystemType,
  (layoutSystemType: LayoutSystemTypes): boolean => {
    return layoutSystemType === LayoutSystemTypes.AUTO;
  },
);
