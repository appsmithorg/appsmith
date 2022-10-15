import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export interface TenantReduxState {
  userPermissions: string[];
  tenantConfiguration: Record<string, string>;
  new: boolean;
}

export const initialState: TenantReduxState = {
  userPermissions: [],
  tenantConfiguration: {},
  new: false,
};

export const handlers = {
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    state: TenantReduxState,
    action: ReduxAction<TenantReduxState>,
  ) => ({
    ...state,
    ...action.payload,
  }),
  [ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR]: (
    state: TenantReduxState,
  ) => ({
    ...state,
  }),
};

export default createReducer(initialState, handlers);
