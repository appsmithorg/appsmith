import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionWithoutPayload,
  WidgetReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  ExecuteActionPayload,
  ExecuteErrorPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import { BatchAction, batchAction } from "actions/batchActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { WidgetProps } from "widgets/BaseWidget";

export const executeAction = (
  payload: ExecuteActionPayload,
): BatchAction<ExecuteActionPayload> =>
  batchAction({
    type: ReduxActionTypes.EXECUTE_ACTION,
    payload,
  });

export const executeActionError = (
  executeErrorPayload: ExecuteErrorPayload,
): ReduxAction<ExecuteErrorPayload> => {
  return {
    type: ReduxActionErrorTypes.EXECUTE_ACTION_ERROR,
    payload: executeErrorPayload,
  };
};

export const executePageLoadActions = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
});

export const disableDragAction = (
  isDraggingDisabled: boolean,
): ReduxAction<{ isDraggingDisabled: boolean }> => {
  return {
    type: ReduxActionTypes.DISABLE_WIDGET_DRAG,
    payload: {
      isDraggingDisabled,
    },
  };
};

export const createModalAction = (
  modalName: string,
): ReduxAction<{ modalName: string }> => {
  return {
    type: ReduxActionTypes.CREATE_MODAL_INIT,
    payload: {
      modalName,
    },
  };
};

export const focusWidget = (
  widgetId?: string,
): ReduxAction<{ widgetId?: string }> => ({
  type: ReduxActionTypes.FOCUS_WIDGET,
  payload: { widgetId },
});

export const showModal = (id: string) => {
  return {
    type: ReduxActionTypes.SHOW_MODAL,
    payload: {
      modalId: id,
    },
  };
};

export const closeAllModals = () => {
  return {
    type: ReduxActionTypes.CLOSE_MODAL,
    payload: {},
  };
};

export const forceOpenPropertyPane = (id: string) => {
  PerformanceTracker.startTracking(
    PerformanceTransactionName.OPEN_PROPERTY_PANE,
  );
  return {
    type: ReduxActionTypes.SHOW_PROPERTY_PANE,
    payload: {
      widgetId: id,
      force: true,
    },
  };
};

export const closePropertyPane = () => {
  return {
    type: ReduxActionTypes.HIDE_PROPERTY_PANE,
    payload: {
      force: false,
    },
  };
};

export const closeTableFilterPane = () => {
  return {
    type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
    payload: {
      force: false,
    },
  };
};

export const copyWidget = (isShortcut: boolean) => {
  return {
    type: ReduxActionTypes.COPY_SELECTED_WIDGET_INIT,
    payload: {
      isShortcut: !!isShortcut,
    },
  };
};

export const pasteWidget = () => {
  return {
    type: ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
  };
};

export const deleteSelectedWidget = (
  isShortcut: boolean,
  disallowUndo = false,
) => {
  return {
    type: WidgetReduxActionTypes.WIDGET_DELETE,
    payload: {
      isShortcut,
      disallowUndo,
    },
  };
};

export const cutWidget = () => {
  return {
    type: ReduxActionTypes.CUT_SELECTED_WIDGET,
  };
};

export const addSuggestedWidget = (payload: Partial<WidgetProps>) => {
  return {
    type: ReduxActionTypes.ADD_SUGGESTED_WIDGET,
    payload,
  };
};
