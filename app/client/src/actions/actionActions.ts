import { PaginationField, ActionResponse } from "api/ActionAPI";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { Action, RestAction } from "entities/Action";

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
  applicationId: string,
): ReduxAction<FetchActionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_INIT,
    payload: { applicationId },
  };
};

export const fetchActionsForPage = (pageId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
    payload: { pageId },
  };
};

export const fetchActionsForPageSuccess = (actions: RestAction[]) => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
    payload: actions,
  };
};

export const runApiAction = (id: string, paginationField?: PaginationField) => {
  return {
    type: ReduxActionTypes.RUN_API_REQUEST,
    payload: {
      id: id,
      paginationField: paginationField,
    },
  };
};

export const updateAction = (payload: { data: RestAction }) => {
  return {
    type: ReduxActionTypes.UPDATE_ACTION_INIT,
    payload,
  };
};

export const updateActionSuccess = (payload: { data: RestAction }) => {
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

export const moveActionSuccess = (payload: RestAction) => {
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

export const copyActionSuccess = (payload: {
  id: string;
  destinationPageId: string;
}) => {
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
}) => ({
  type: ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS,
  payload: payload,
});

export const editApiName = (payload: { id: string; value: string }) => ({
  type: ReduxActionTypes.EDIT_API_NAME,
  payload: payload,
});

export const saveApiName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_API_NAME,
  payload: payload,
});

export const updateApiNameDraft = (payload: {
  id: string;
  draft?: {
    value: string;
    validation: {
      isValid: boolean;
      validationMessage: string;
    };
  };
}) => ({
  type: ReduxActionTypes.UPDATE_API_NAME_DRAFT,
  payload: payload,
});

export default {
  createAction: createActionRequest,
  fetchActions,
  runAction: runApiAction,
  deleteAction,
  deleteActionSuccess,
  updateAction,
  updateActionSuccess,
};
