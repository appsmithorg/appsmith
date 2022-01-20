import { AppState } from "reducers";
import { widgetReflowState } from "reducers/uiReducers/reflowReducer";
import { createSelector } from "reselect";

export const getReflow = (state: AppState): widgetReflowState =>
  state.ui.widgetReflow;

export const isReflowEnabled = (state: any): boolean =>
  state.ui.widgetReflow.enableReflow;

export const getIsReflowing = (state: AppState): boolean =>
  state.ui.widgetReflow.isReflowing;

export const getIsShowReflowCard = (state: AppState): boolean =>
  !state.ui.widgetReflow.cardShown;

export const getReflowSelector = (widgetId: string) => {
  return createSelector(getReflow, (reflowState: widgetReflowState) => {
    if (reflowState?.reflowingWidgets) {
      return reflowState?.reflowingWidgets[widgetId];
    }
    return undefined;
  });
};
