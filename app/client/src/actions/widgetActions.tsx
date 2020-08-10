import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import {
  ExecuteActionPayload,
  ExecuteErrorPayload,
  PageAction,
} from "constants/ActionConstants";
import { BatchAction, batchAction } from "actions/batchActions";

export const executeAction = (
  payload: ExecuteActionPayload,
): BatchAction<ExecuteActionPayload> =>
  batchAction({
    type: ReduxActionTypes.EXECUTE_ACTION,
    payload,
  });

export const executeActionError = (
  executeErrorPayload: ExecuteErrorPayload,
): ReduxAction<ExecuteErrorPayload> => ({
  type: ReduxActionErrorTypes.EXECUTE_ACTION_ERROR,
  payload: executeErrorPayload,
});

export const executePageLoadActions = (
  payload: PageAction[][],
): BatchAction<PageAction[][]> =>
  batchAction({
    type: ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
    payload,
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
  return {
    type: ReduxActionTypes.SHOW_PROPERTY_PANE,
    payload: {
      widgetId: id,
      force: true,
    },
  };
};
