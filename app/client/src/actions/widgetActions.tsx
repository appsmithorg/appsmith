import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { PaginationField } from "api/ActionAPI";

import {
  ActionPayload,
  ExecuteErrorPayload,
  PageAction,
} from "constants/ActionConstants";

export const executeAction = (
  actionPayloads: ActionPayload[],
  paginationField?: PaginationField,
): ReduxAction<{
  actions: ActionPayload[];
  paginationField: PaginationField;
}> => {
  return {
    type: ReduxActionTypes.EXECUTE_ACTION,
    payload: {
      actions: actionPayloads,
      paginationField: paginationField,
    },
  };
};

export const executeActionError = (
  executeErrorPayload: ExecuteErrorPayload,
): ReduxAction<ExecuteErrorPayload> => ({
  type: ReduxActionErrorTypes.EXECUTE_ACTION_ERROR,
  payload: executeErrorPayload,
});

export const executePageLoadActions = (
  payload: PageAction[][],
): ReduxAction<PageAction[][]> => ({
  type: ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
  payload,
});

export const disableDragAction = (
  disable: boolean,
): ReduxAction<{ disable: boolean }> => {
  return {
    type: ReduxActionTypes.DISABLE_WIDGET_DRAG,
    payload: {
      disable,
    },
  };
};

export type WidgetLoadingState = {
  areLoading: boolean;
  widgetIds: string[];
};
