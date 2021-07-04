import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

export const selectWidgetAction = (
  widgetId?: string,
  isMultiSelect?: boolean,
): ReduxAction<{ widgetId?: string; isMultiSelect?: boolean }> => ({
  type: ReduxActionTypes.SELECT_WIDGET,
  payload: { widgetId, isMultiSelect },
});

export const selectWidgetInitAction = (
  widgetId?: string,
  isMultiSelect?: boolean,
): ReduxAction<{ widgetId?: string; isMultiSelect?: boolean }> => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { widgetId, isMultiSelect },
});

export const selectMultipleWidgetsAction = (
  widgetIds?: string[],
): ReduxAction<{ widgetIds?: string[] }> => {
  return {
    type: ReduxActionTypes.SELECT_MULTIPLE_WIDGETS,
    payload: { widgetIds },
  };
};

export const silentAddSelectionsAction = (
  widgetIds?: string[],
): ReduxAction<{ widgetIds?: string[] }> => {
  return {
    type: ReduxActionTypes.SELECT_WIDGETS,
    payload: { widgetIds },
  };
};

export const deselectMultipleWidgetsAction = (
  widgetIds?: string[],
): ReduxAction<{ widgetIds?: string[] }> => {
  return {
    type: ReduxActionTypes.DESELECT_WIDGETS,
    payload: { widgetIds },
  };
};

export const selectAllWidgetsInCanvasInitAction = (
  canvasId = MAIN_CONTAINER_WIDGET_ID,
): ReduxAction<{ canvasId: string }> => {
  return {
    type: ReduxActionTypes.SELECT_ALL_WIDGETS_IN_CANVAS_INIT,
    payload: {
      canvasId,
    },
  };
};

export const selectMultipleWidgetsInitAction = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SELECT_MULTIPLE_WIDGETS_INIT,
    payload: { widgetIds },
  };
};

export const shiftSelectWidgetsEntityExplorerInitAction = (
  widgetId: string,
  siblingWidgets: string[],
): ReduxAction<{ widgetId: string; siblingWidgets: string[] }> => ({
  type: ReduxActionTypes.SHIFT_SELECT_WIDGET_INIT,
  payload: { widgetId, siblingWidgets },
});
