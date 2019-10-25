import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { RestAction } from "../api/ActionAPI";

export const createAction = (payload: RestAction) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_INIT,
    payload,
  };
};

export const createActionSuccess = (payload: RestAction) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_SUCCESS,
    payload,
  };
};

export const fetchActions = () => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_INIT,
  };
};

export const fetchApiConfig = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.FETCH_ACTION,
    payload,
  };
};

export const runAction = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.RUN_ACTION_INIT,
    payload,
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

export const deleteAction = (payload: { id: string }) => {
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

export default {
  createAction,
  fetchActions,
  fetchApiConfig,
  runAction,
  deleteAction,
  deleteActionSuccess,
  updateAction,
  updateActionSuccess,
};
