import type { DefaultRootState } from "react-redux";
import type { widgetReflow } from "reducers/uiReducers/reflowReducer";
import { createSelector } from "reselect";
import { getIsResizing } from "./widgetSelectors";

export const getReflow = (state: DefaultRootState): widgetReflow =>
  state.ui.widgetReflow;

export const getIsReflowing = (state: DefaultRootState): boolean =>
  state.ui.widgetReflow.isReflowing;

export const getReflowSelector = (widgetId: string) => {
  return createSelector(getReflow, (reflowState: widgetReflow) => {
    if (reflowState?.reflowingWidgets) {
      return reflowState?.reflowingWidgets[widgetId];
    }

    return undefined;
  });
};

export const getIsReflowEffectedSelector = (
  widgetId: string | undefined,
  reflowed: boolean,
) => {
  return createSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.dragDetails,
    getIsResizing,
    (dragDetails, isResizing) => {
      return (
        ((widgetId &&
          dragDetails &&
          !!dragDetails.draggedOn &&
          dragDetails.draggedOn === widgetId) ||
          isResizing) &&
        reflowed
      );
    },
  );
};
