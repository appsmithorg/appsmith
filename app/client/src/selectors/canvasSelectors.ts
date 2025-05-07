import { LayoutSystemTypes } from "layoutSystems/types";
import { createSelector } from "reselect";
import type { DefaultRootState } from "react-redux";
import { getLayoutSystemType } from "./layoutSystemSelectors";

export const getIsDraggingForSelection = (state: DefaultRootState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};

export const getIsAutoLayout = createSelector(
  getLayoutSystemType,
  (layoutSystemType: LayoutSystemTypes): boolean => {
    return layoutSystemType === LayoutSystemTypes.AUTO;
  },
);
