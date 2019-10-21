import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { RestAction } from "../api/ActionAPI";

export const createAction = (payload: RestAction) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION,
    payload,
  };
};

export const fetchActions = () => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_INIT,
  };
};

export const selectAction = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.SELECT_ACTION,
    payload,
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
    type: ReduxActionTypes.RUN_ACTION,
    payload,
  };
};

export const deleteAction = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.DELETE_ACTION,
    payload,
  };
};

export const updateAction = (payload: { data: RestAction }) => {
  return {
    type: ReduxActionTypes.UPDATE_ACTION,
    payload,
  };
};

export default {
  createAction,
  fetchActions,
  fetchApiConfig,
  runAction,
  deleteAction,
};
