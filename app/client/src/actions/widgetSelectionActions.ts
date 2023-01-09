import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { CanvasWidgetsStructureReduxState } from "reducers/entityReducers/canvasWidgetsStructureReducer";

export type SelectWidgetActionPayload = {
  widgetId?: string;
  isMultiSelect?: boolean;
  selectSiblings?: boolean;
};

export type SelectMultipleWidgetsActionPayload = { widgetIds?: string[] };

// Use to select a widget programmatically via platform action
export const selectWidgetInitAction = (
  widgetId?: string,
  isMultiSelect?: boolean,
  selectSiblings?: boolean,
): ReduxAction<SelectWidgetActionPayload> => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { widgetId, isMultiSelect, selectSiblings },
});

export const selectMultipleWidgetsAction = (
  widgetIds?: string[],
): ReduxAction<SelectMultipleWidgetsActionPayload> => {
  return {
    type: ReduxActionTypes.SELECT_MULTIPLE_WIDGETS,
    payload: { widgetIds },
  };
};

export const selectAllWidgetsInCanvasInitAction = () => {
  return {
    type: ReduxActionTypes.SELECT_ALL_WIDGETS_IN_CANVAS_INIT,
  };
};

export const selectMultipleWidgetsInitAction = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SELECT_MULTIPLE_WIDGETS_INIT,
    payload: { widgetIds },
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
