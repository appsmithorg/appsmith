import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import type { BatchAction } from "actions/batchActions";
import { batchAction } from "actions/batchActions";
import type { WidgetProps } from "widgets/BaseWidget";

export const executeTrigger = (
  payload: ExecuteTriggerPayload,
): BatchAction<ExecuteTriggerPayload> =>
  batchAction({
    type: ReduxActionTypes.EXECUTE_TRIGGER_REQUEST,
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

export const showModal = (id: string, shouldSelectModal = true) => {
  return {
    type: ReduxActionTypes.SHOW_MODAL,
    payload: {
      modalId: id,
      shouldSelectModal,
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

export const pasteWidget = (
  groupWidgets = false,
  mouseLocation: { x: number; y: number },
) => {
  return {
    type: ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
    payload: {
      groupWidgets: groupWidgets,
      mouseLocation,
    },
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

/**
 * action to group selected widgets into container
 * @returns
 */
export const groupWidgets = () => {
  return {
    type: ReduxActionTypes.GROUP_WIDGETS_INIT,
  };
};
