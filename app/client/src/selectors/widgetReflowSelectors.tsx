import { AppState } from "reducers";
import { widgetReflow } from "reducers/uiReducers/reflowReducer";
import { createSelector } from "reselect";

export const getReflow = (state: AppState): widgetReflow =>
  state.ui.widgetReflow;

export const getIsReflowing = (state: AppState): boolean =>
  state.ui.widgetReflow.isReflowing;

export const getReflowSelector = (widgetId: string) => {
  return createSelector(getReflow, (reflowState: widgetReflow) => {
    if (reflowState?.reflowingWidgets) {
      return reflowState?.reflowingWidgets[widgetId];
    }
    return undefined;
  });
};
