import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { CanvasWidgetsStructureReduxState } from "reducers/entityReducers/canvasWidgetsStructureReducer";

export type SelectionRequest = string | string[];

export type SelectWidgetActionPayload = {
  selectionRequest: SelectionRequest;
  isMultiSelect?: boolean;
  selectSiblings?: boolean;
};

// Use to select a widget programmatically via platform action
export const selectWidgetInitAction = (
  selectionRequest: SelectionRequest,
  isMultiSelect?: boolean,
  selectSiblings?: boolean,
): ReduxAction<SelectWidgetActionPayload> => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { selectionRequest, isMultiSelect, selectSiblings },
});

export const selectAllWidgetsInCanvasInitAction = () => {
  return {
    type: ReduxActionTypes.SELECT_ALL_WIDGETS_IN_CANVAS_INIT,
  };
};

export const deselectModalWidgetAction = (
  modalId: string,
  modalWidgetChildren?: CanvasWidgetsStructureReduxState[],
) => {
  return {
    type: ReduxActionTypes.DESELECT_MODAL_WIDGETS,
    payload: { modalId, modalWidgetChildren },
  };
};

export const appendSelectedWidgetToUrl = (selectedWidgets: string[]) => {
  return {
    type: ReduxActionTypes.APPEND_SELECTED_WIDGET_TO_URL,
    payload: { selectedWidgets },
  };
};

// To be used to collect selected widget state from url and set on state
export const setSelectedWidgets = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_WIDGETS,
    payload: { widgetIds },
  };
};

export const setLastSelectedWidget = (widgetId: string) => {
  return {
    type: ReduxActionTypes.SET_LAST_SELECTED_WIDGET,
    payload: { lastSelectedWidget: widgetId },
  };
};

export const setSelectedWidgetAncestry = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTRY,
    payload: widgetIds,
  };
};
