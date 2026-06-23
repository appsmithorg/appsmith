import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { ApplicationPayload } from "entities/Application";

export interface CopyEntityToAppReduxState {
  targetApplications: ApplicationPayload[];
  isFetchingApplications: boolean;
  isCopying: boolean;
}

const initialState: CopyEntityToAppReduxState = {
  targetApplications: [],
  isFetchingApplications: false,
  isCopying: false,
};

const copyEntityToAppReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isFetchingApplications: true,
    targetApplications: [],
  }),
  [ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_SUCCESS]: (
    state: CopyEntityToAppReduxState,
    action: ReduxAction<{ applications: ApplicationPayload[] }>,
  ) => ({
    ...state,
    isFetchingApplications: false,
    targetApplications: action.payload.applications,
  }),
  [ReduxActionErrorTypes.FETCH_COPY_TARGET_APPLICATIONS_ERROR]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isFetchingApplications: false,
    targetApplications: [],
  }),
  [ReduxActionTypes.COPY_ACTION_TO_APP_INIT]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isCopying: true,
  }),
  [ReduxActionTypes.COPY_JS_ACTION_TO_APP_INIT]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isCopying: true,
  }),
  [ReduxActionTypes.COPY_ACTION_TO_APP_SUCCESS]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isCopying: false,
  }),
  [ReduxActionTypes.COPY_JS_ACTION_TO_APP_SUCCESS]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isCopying: false,
  }),
  [ReduxActionErrorTypes.COPY_ACTION_TO_APP_ERROR]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isCopying: false,
  }),
  [ReduxActionErrorTypes.COPY_JS_ACTION_TO_APP_ERROR]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isCopying: false,
  }),
});

export default copyEntityToAppReducer;
