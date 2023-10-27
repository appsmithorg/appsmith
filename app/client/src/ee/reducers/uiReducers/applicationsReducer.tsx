export * from "ce/reducers/uiReducers/applicationsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ApplicationsReduxState as CE_ApplicationsReduxState } from "ce/reducers/uiReducers/applicationsReducer";
import {
  initialState as CE_initialState,
  handlers as CE_handlers,
} from "ce/reducers/uiReducers/applicationsReducer";
import type { WorkspaceUser } from "@appsmith/constants/workspaceConstants";
import { createReducer } from "utils/ReducerUtils";

export const initialState: ApplicationsReduxState = {
  ...CE_initialState,
  applicationUsers: [],
  applicationRoles: [],
};

export interface ApplicationsReduxState extends CE_ApplicationsReduxState {
  applicationUsers: WorkspaceUser[];
  applicationRoles: any;
}

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_ALL_APP_USERS_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchAllUsers: true,
      },
    };
  },
  [ReduxActionTypes.FETCH_ALL_APP_USERS_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<WorkspaceUser[]>,
  ) => {
    return {
      ...state,
      applicationUsers: action.payload,
      loadingStates: {
        ...state.loadingStates,
        isFetchAllUsers: false,
      },
    };
  },
  [ReduxActionTypes.FETCH_ALL_APP_ROLES_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchAllRoles: true,
      },
    };
  },
  [ReduxActionTypes.FETCH_ALL_APP_ROLES_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<any[]>,
  ) => {
    return {
      ...state,
      applicationRoles: action.payload,
      loadingStates: {
        ...state.loadingStates,
        isFetchAllRoles: false,
      },
    };
  },
  [ReduxActionTypes.FETCH_APP_DEFAULT_ROLES_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isFetchAllRoles: true,
      },
    };
  },
  [ReduxActionTypes.FETCH_APP_DEFAULT_ROLES_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<any[]>,
  ) => {
    return {
      ...state,
      applicationRoles: action.payload,
      loadingStates: {
        ...state.loadingStates,
        isFetchAllRoles: false,
      },
    };
  },
};

const applicationsReducer = createReducer(initialState, handlers);

export default applicationsReducer;
