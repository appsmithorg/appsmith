import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { OrgRole, Org } from "constants/orgConstants";

const initialState: OrgReduxState = {
  loadingStates: {
    fetchingRoles: false,
  },
};

const orgReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_ORG_ROLES_INIT]: (state: OrgReduxState) => ({
    ...state,
    roles: undefined,
    loadingStates: {
      ...state.loadingStates,
      fetchingRoles: true,
    },
  }),
  [ReduxActionTypes.FETCH_ORG_ROLES_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<OrgRole[]>,
  ) => ({
    ...state,
    roles: action.payload,
    loadingStates: {
      ...state.loadingStates,
      fetchingRoles: false,
    },
  }),
  [ReduxActionErrorTypes.FETCH_ORG_ROLES_ERROR]: (state: OrgReduxState) => ({
    ...state,
    roles: undefined,
    loadingStates: {
      ...state.loadingStates,
      fetchingRoles: false,
    },
  }),
  [ReduxActionTypes.FETCH_ORGS_SUCCESS]: (
    state: OrgReduxState,
    action: ReduxAction<Org[]>,
  ) => ({
    ...state,
    list: action.payload,
  }),
});

export interface OrgReduxState {
  list?: Org[];
  roles?: OrgRole[];
  loadingStates: {
    fetchingRoles: boolean;
  };
}

export default orgReducer;
