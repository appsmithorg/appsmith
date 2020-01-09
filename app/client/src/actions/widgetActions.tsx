import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { ActionPayload, PageAction } from "constants/ActionConstants";

export const executeAction = (
  actionPayloads?: ActionPayload[],
): ReduxAction<ActionPayload[] | undefined> => {
  return {
    type: ReduxActionTypes.EXECUTE_ACTION,
    payload: actionPayloads,
  };
};

export const executePageLoadActions = (
  payload: PageAction[],
): ReduxAction<PageAction[]> => ({
  type: ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
  payload,
});

export const loadingAction = (
  areLoading: boolean,
  widgetIds: string[],
): ReduxAction<WidgetLoadingState> => {
  return {
    type: ReduxActionTypes.LOADING_ACTION,
    payload: {
      areLoading: areLoading,
      widgetIds: widgetIds,
    },
  };
};

export const disableDragAction = (
  disable: boolean,
): ReduxAction<WidgetDraggingState> => {
  return {
    type: ReduxActionTypes.DISABLE_WIDGET_DRAG,
    payload: {
      disable: disable,
    },
  };
};

export type WidgetDraggingState = {
  disable: boolean;
};

export type WidgetLoadingState = {
  areLoading: boolean;
  widgetIds: string[];
};
