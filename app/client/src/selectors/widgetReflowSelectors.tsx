import { cloneDeep } from "lodash";
import { AppState } from "reducers";
import { widgetReflowState } from "reducers/uiReducers/reflowReducer";
import { createSelector } from "reselect";
import { getOccupiedSpaces } from "./editorSelectors";

const getReflow = (state: AppState): widgetReflowState => state.ui.widgetReflow;

export const getReflowSelector = (widgetId: string) => {
  return createSelector(getReflow, (reflowState: widgetReflowState) => {
    if (reflowState.reflow?.reflowingWidgets) {
      return reflowState.reflow.reflowingWidgets[widgetId];
    }
  });
};

export const getReflowStaticWidgetSelector = (widgetId: string) => {
  return createSelector(getReflow, (reflowState: widgetReflowState) => {
    if (
      reflowState.reflow.staticWidget &&
      reflowState.reflow.staticWidget.id === widgetId
    ) {
      return reflowState.reflow.staticWidget;
    }
  });
};
