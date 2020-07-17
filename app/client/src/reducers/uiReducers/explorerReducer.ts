import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

export interface ExplorerReduxState {
  updatingEntity?: string;
  updateEntityError?: string;
}
const initialState: ExplorerReduxState = {};

const setUpdatingEntity = (
  state: ExplorerReduxState,
  action: ReduxAction<{ id: string }>,
) => {
  return { updatingEntity: action.payload.id, updateEntityError: undefined };
};

const setEntityUpdateError = (state: ExplorerReduxState) => {
  return { updatingEntity: undefined };
};

const setEntityUpdateSuccess = () => {
  return {};
};

const explorerReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.UPDATE_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.MOVE_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.MOVE_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.MOVE_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.COPY_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.COPY_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.COPY_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_DATASOURCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_DATASOURCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.UPDATE_DATASOURCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.UPDATE_PAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.UPDATE_PAGE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_PAGE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SET_DEFAULT_APPLICATION_PAGE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.UPDATE_WIDGET_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS]: setEntityUpdateSuccess,
});

export default explorerReducer;
