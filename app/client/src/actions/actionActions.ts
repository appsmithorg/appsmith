import { PaginationField, ActionResponse } from "api/ActionAPI";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { Action } from "entities/Action";
import { batchAction } from "actions/batchActions";

export const createActionRequest = (
  payload: Partial<Action> & { eventData: any },
) => {
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
  applicationId: string,
): ReduxAction<FetchActionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_INIT,
    payload: { applicationId },
  };
};

export const fetchActionsForView = (
  applicationId: string,
): ReduxAction<FetchActionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_INIT,
    payload: { applicationId },
  };
};

export const fetchActionsForPage = (pageId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
    payload: { pageId },
  };
};

export const fetchActionsForPageSuccess = (actions: Action[]) => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
    payload: actions,
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

export const runActionInit = (
  id: string,
  paginationField?: PaginationField,
) => {
  return {
    type: ReduxActionTypes.RUN_ACTION_INIT,
    payload: {
      id,
      paginationField,
    },
  };
};

export const showRunActionConfirmModal = (show: boolean) => {
  return {
    type: ReduxActionTypes.SHOW_RUN_ACTION_CONFIRM_MODAL,
    payload: show,
  };
};

export const cancelRunActionConfirmModal = () => {
  return {
    type: ReduxActionTypes.CANCEL_RUN_ACTION_CONFIRM_MODAL,
  };
};

export const acceptRunActionConfirmModal = () => {
  return {
    type: ReduxActionTypes.ACCEPT_RUN_ACTION_CONFIRM_MODAL,
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

export const deleteAction = (payload: { id: string; name: string }) => {
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

export const executeApiActionRequest = (payload: { id: string }) => ({
  type: ReduxActionTypes.EXECUTE_API_ACTION_REQUEST,
  payload: payload,
});

export const executeApiActionSuccess = (payload: {
  id: string;
  response: ActionResponse;
  isPageLoad?: boolean;
}) => ({
  type: ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS,
  payload: payload,
});

export const saveActionName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_ACTION_NAME_INIT,
  payload: payload,
});

export type SetActionPropertyPayload = {
  actionId: string;
  propertyName: string;
  value: any;
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

export const setActionsToExecuteOnPageLoad = (actions: string[]) => {
  return {
    type: ReduxActionTypes.SET_ACTION_TO_EXECUTE_ON_PAGELOAD,
    payload: actions,
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
};
