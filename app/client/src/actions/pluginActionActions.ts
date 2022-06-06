import { ActionResponse, PaginationField } from "api/ActionAPI";
import {
  EvaluationReduxAction,
  AnyReduxAction,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "@appsmith/constants/ReduxActionConstants";
import { Action } from "entities/Action";
import { batchAction } from "actions/batchActions";
import { ExecuteErrorPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { ModalInfo } from "reducers/uiReducers/modalActionReducer";

export const createActionRequest = (payload: Partial<Action>) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_INIT,
    payload,
  };
};

export const createActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_SUCCESS,
    payload,
  };
};

export type FetchActionsPayload = {
  applicationId: string;
};

export const fetchActions = (
  { applicationId }: { applicationId: string },
  postEvalActions: Array<AnyReduxAction>,
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_INIT,
    payload: { applicationId },
    postEvalActions,
  };
};

export const fetchActionsForView = ({
  applicationId,
}: {
  applicationId: string;
}): ReduxAction<FetchActionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_INIT,
    payload: { applicationId },
  };
};

export const fetchActionsForPage = (
  pageId: string,
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
    payload: { pageId },
  };
};

export const fetchActionsForPageSuccess = (
  actions: Action[],
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
    payload: actions,
  };
};

export const fetchActionsForPageError = () => {
  return {
    type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
  };
};

export const runActionViaShortcut = () => {
  return {
    type: ReduxActionTypes.RUN_ACTION_SHORTCUT_REQUEST,
  };
};

export const runAction = (id: string, paginationField?: PaginationField) => {
  return {
    type: ReduxActionTypes.RUN_ACTION_REQUEST,
    payload: {
      id,
      paginationField,
    },
  };
};

export const showActionConfirmationModal = (payload: ModalInfo) => {
  return {
    type: ReduxActionTypes.SHOW_ACTION_MODAL,
    payload,
  };
};

export const cancelActionConfirmationModal = (payload: string) => {
  return {
    type: ReduxActionTypes.CANCEL_ACTION_MODAL + `_FOR_${payload.trim()}`,
  };
};

export const acceptActionConfirmationModal = (payload: string) => {
  return {
    type: ReduxActionTypes.CONFIRM_ACTION_MODAL + `_FOR_${payload.trim()}`,
  };
};

export const updateAction = (payload: { id: string }) => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_ACTION_INIT,
    payload,
  });
};

export const updateActionSuccess = (payload: { data: Action }) => {
  return {
    type: ReduxActionTypes.UPDATE_ACTION_SUCCESS,
    payload,
  };
};

export const clearActionResponse = (actionId: string) => {
  return {
    type: ReduxActionTypes.CLEAR_ACTION_RESPONSE,
    payload: {
      actionId,
    },
  };
};

export const deleteAction = (payload: {
  id: string;
  name: string;
  onSuccess?: () => void;
}) => {
  return {
    type: ReduxActionTypes.DELETE_ACTION_INIT,
    payload,
  };
};

export const deleteActionSuccess = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.DELETE_ACTION_SUCCESS,
    payload,
  };
};

export const moveActionRequest = (payload: {
  id: string;
  destinationPageId: string;
  originalPageId: string;
  name: string;
}) => {
  return {
    type: ReduxActionTypes.MOVE_ACTION_INIT,
    payload,
  };
};

export const moveActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.MOVE_ACTION_SUCCESS,
    payload,
  };
};

export const moveActionError = (payload: {
  id: string;
  originalPageId: string;
}) => {
  return {
    type: ReduxActionErrorTypes.MOVE_ACTION_ERROR,
    payload,
  };
};

export const copyActionRequest = (payload: {
  id: string;
  destinationPageId: string;
  name: string;
}) => {
  return {
    type: ReduxActionTypes.COPY_ACTION_INIT,
    payload,
  };
};

export const copyActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.COPY_ACTION_SUCCESS,
    payload,
  };
};

export const copyActionError = (payload: {
  id: string;
  destinationPageId: string;
}) => {
  return {
    type: ReduxActionErrorTypes.COPY_ACTION_ERROR,
    payload,
  };
};

export const executePluginActionRequest = (payload: { id: string }) => ({
  type: ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST,
  payload: payload,
});

export const executePluginActionSuccess = (payload: {
  id: string;
  response: ActionResponse;
  isPageLoad?: boolean;
}) => ({
  type: ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  payload: payload,
});

export const setActionResponseDisplayFormat = (
  payload: UpdateActionPropertyActionPayload,
) => ({
  type: ReduxActionTypes.SET_ACTION_RESPONSE_DISPLAY_FORMAT,
  payload: payload,
});

export const executePluginActionError = (
  executeErrorPayload: ExecuteErrorPayload,
): ReduxAction<ExecuteErrorPayload> => {
  return {
    type: ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
    payload: executeErrorPayload,
  };
};

export const saveActionName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_ACTION_NAME_INIT,
  payload: payload,
});

export type SetActionPropertyPayload = {
  actionId: string;
  propertyName: string;
  value: any;
  skipSave?: boolean;
};

export const setActionProperty = (payload: SetActionPropertyPayload) => ({
  type: ReduxActionTypes.SET_ACTION_PROPERTY,
  payload,
});

export type UpdateActionPropertyActionPayload = {
  id: string;
  field: string;
  value: any;
};

export const updateActionProperty = (
  payload: UpdateActionPropertyActionPayload,
) => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_ACTION_PROPERTY,
    payload,
  });
};

export const executePageLoadActions = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
});

export const setActionsToExecuteOnPageLoad = (
  actions: Array<{
    executeOnLoad: boolean;
    id: string;
    name: string;
  }>,
) => {
  return {
    type: ReduxActionTypes.SET_ACTION_TO_EXECUTE_ON_PAGELOAD,
    payload: actions,
  };
};

export const setJSActionsToExecuteOnPageLoad = (
  actions: Array<{
    executeOnLoad: boolean;
    id: string;
    name: string;
    collectionId?: string;
  }>,
) => {
  return {
    type: ReduxActionTypes.SET_JS_ACTION_TO_EXECUTE_ON_PAGELOAD,
    payload: actions,
  };
};

export const bindDataOnCanvas = (payload: {
  queryId: string;
  applicationId: string;
  pageId: string;
}) => {
  return {
    type: ReduxActionTypes.BIND_DATA_ON_CANVAS,
    payload,
  };
};

export default {
  createAction: createActionRequest,
  fetchActions,
  runAction: runAction,
  deleteAction,
  deleteActionSuccess,
  updateAction,
  updateActionSuccess,
  bindDataOnCanvas,
};
