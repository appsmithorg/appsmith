import { AppState } from "reducers";
import { widgetReflowState } from "reducers/uiReducers/reflowReducer";
import { createSelector } from "reselect";

export const getReflow = (state: AppState): widgetReflowState =>
  state.ui.widgetReflow;

export const getShouldResize = (state: any): boolean =>
  state.ui.widgetReflow.shouldResize;

export const getReflowSelector = (widgetId: string) => {
  return createSelector(getReflow, (reflowState: widgetReflowState) => {
    if (reflowState?.reflowingWidgets) {
      return reflowState?.reflowingWidgets[widgetId];
    }
    return;
  });
};
