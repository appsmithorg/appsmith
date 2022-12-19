import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { CanvasWidgetsStructureReduxState } from "reducers/entityReducers/canvasWidgetsStructureReducer";

export type SelectWidgetActionPayload = {
  widgetId?: string;
  isMultiSelect?: boolean;
};

export type SelectMultipleWidgetsActionPayload = { widgetIds?: string[] };

export const selectWidgetAction = (
  widgetId?: string,
  isMultiSelect?: boolean,
): ReduxAction<SelectWidgetActionPayload> => ({
  type: ReduxActionTypes.SELECT_WIDGET,
  payload: { widgetId, isMultiSelect },
});

export const selectWidgetInitAction = (
  widgetId?: string,
  isMultiSelect?: boolean,
): ReduxAction<SelectWidgetActionPayload> => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { widgetId, isMultiSelect },
});

export const deselectAllInitAction = () => {
  return {
    type: ReduxActionTypes.DESELECT_MULTIPLE_WIDGETS_INIT,
  };
};

export const selectMultipleWidgetsAction = (
  widgetIds?: string[],
): ReduxAction<SelectMultipleWidgetsActionPayload> => {
  return {
    type: ReduxActionTypes.SELECT_MULTIPLE_WIDGETS,
    payload: { widgetIds },
  };
};

export const silentAddSelectionsAction = (
  widgetIds?: string[],
): ReduxAction<SelectMultipleWidgetsActionPayload> => {
  return {
    type: ReduxActionTypes.SELECT_WIDGETS,
    payload: { widgetIds },
  };
};

export const deselectMultipleWidgetsAction = (
  widgetIds?: string[],
): ReduxAction<SelectMultipleWidgetsActionPayload> => {
  return {
    type: ReduxActionTypes.DESELECT_WIDGETS,
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

export const shiftSelectWidgetsEntityExplorerInitAction = (
  widgetId: string,
  siblingWidgets: string[],
): ReduxAction<{ widgetId: string; siblingWidgets: string[] }> => ({
  type: ReduxActionTypes.SHIFT_SELECT_WIDGET_INIT,
  payload: { widgetId, siblingWidgets },
});

export const appendSelectedWidgetToUrl = (selectedWidgets: string[]) => {
  return {
    type: ReduxActionTypes.APPEND_SELECTED_WIDGET_TO_URL,
    payload: { selectedWidgets },
  };
};
