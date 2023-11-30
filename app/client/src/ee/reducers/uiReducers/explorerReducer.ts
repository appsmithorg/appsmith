export * from "ce/reducers/uiReducers/explorerReducer";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  initialState,
  handlers as CE_handlers,
  setUpdatingEntity,
  setEntityUpdateError,
  setEntityUpdateSuccess,
} from "ce/reducers/uiReducers/explorerReducer";
import { createImmerReducer } from "utils/ReducerUtils";

export const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.DELETE_QUERY_MODULE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_QUERY_MODULE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_MODULE_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS]: setEntityUpdateSuccess,
};

/**
 * Context Reducer to store states of different components of editor
 */
const editorContextReducer = createImmerReducer(initialState, handlers);

export default editorContextReducer;
