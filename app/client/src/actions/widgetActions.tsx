import type { ReduxAction } from "./ReduxActionTypes";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import type { BatchAction } from "actions/batchActions";
import { batchAction } from "actions/batchActions";
import type { WidgetProps } from "widgets/BaseWidget";
import type { PartialExportParams } from "sagas/PartialImportExportSagas";
import type { PasteWidgetReduxAction } from "constants/WidgetConstants";

export const widgetInitialisationSuccess = () => {
  return {
    type: ReduxActionTypes.WIDGET_INIT_SUCCESS,
  };
};

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
  alt?: boolean,
): ReduxAction<{ widgetId?: string; alt?: boolean }> => ({
  type: ReduxActionTypes.FOCUS_WIDGET,
  payload: { widgetId, alt },
});

export const altFocusWidget = (alt: boolean) => ({
  type: ReduxActionTypes.ALT_FOCUS_WIDGET,
  payload: alt,
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

export const closePropertyPane = (force = false) => {
  return {
    type: ReduxActionTypes.HIDE_PROPERTY_PANE,
    payload: {
      force,
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

export const pasteWidget = ({
  existingWidgets,
  gridPosition,
  groupWidgets = false,
  mouseLocation,
}: PasteWidgetReduxAction) => {
  return {
    type: ReduxActionTypes.VERIFY_LAYOUT_SYSTEM_AND_PASTE_WIDGETS,
    payload: {
      groupWidgets,
      mouseLocation,
      gridPosition,
      existingWidgets,
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

export const openPartialExportModal = (payload: boolean) => {
  return {
    type: ReduxActionTypes.PARTIAL_EXPORT_MODAL_OPEN,
    payload,
  };
};

export const partialExportWidgets = (params: PartialExportParams) => {
  return {
    type: ReduxActionTypes.PARTIAL_EXPORT_INIT,
    payload: params,
  };
};

export const setWidgetSelectionBlock = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_WIDGET_SELECTION_BLOCK,
    payload,
  };
};
