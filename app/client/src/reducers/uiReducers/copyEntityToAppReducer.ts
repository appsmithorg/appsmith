import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { ApplicationPayload } from "entities/Application";
import type { ApplicationPagePayload } from "ee/api/ApplicationApi";
import type { CopyToAppModalEntity } from "pages/Editor/Explorer/CopyToApp/types";

export interface CopyEntityToAppReduxState {
  isModalOpen: boolean;
  entity: CopyToAppModalEntity | null;
  targetApplications: ApplicationPayload[];
  isFetchingApplications: boolean;
  targetPages: ApplicationPagePayload[];
  isFetchingPages: boolean;
  isCopying: boolean;
}

const initialState: CopyEntityToAppReduxState = {
  isModalOpen: false,
  entity: null,
  targetApplications: [],
  isFetchingApplications: false,
  targetPages: [],
  isFetchingPages: false,
  isCopying: false,
};

const copyEntityToAppReducer = createReducer(initialState, {
  [ReduxActionTypes.OPEN_COPY_ENTITY_TO_APP_MODAL]: (
    state: CopyEntityToAppReduxState,
    action: ReduxAction<CopyToAppModalEntity>,
  ) => ({
    ...state,
    isModalOpen: true,
    entity: action.payload,
    targetApplications: [],
    targetPages: [],
    // Clear any transient flags so a stale spinner/disabled CTA from a previous
    // session does not persist when the modal is reopened.
    isFetchingApplications: false,
    isFetchingPages: false,
    isCopying: false,
  }),
  [ReduxActionTypes.CLOSE_COPY_ENTITY_TO_APP_MODAL]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isModalOpen: false,
    entity: null,
    // Same as open: drop any in-flight flags so they cannot leak into the next
    // session.
    isFetchingApplications: false,
    isFetchingPages: false,
    isCopying: false,
  }),
  [ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isFetchingPages: true,
    targetPages: [],
  }),
  [ReduxActionTypes.FETCH_COPY_TARGET_PAGES_SUCCESS]: (
    state: CopyEntityToAppReduxState,
    action: ReduxAction<{ pages: ApplicationPagePayload[] }>,
  ) => ({
    ...state,
    isFetchingPages: false,
    targetPages: action.payload.pages,
  }),
  [ReduxActionErrorTypes.FETCH_COPY_TARGET_PAGES_ERROR]: (
    state: CopyEntityToAppReduxState,
  ) => ({
    ...state,
    isFetchingPages: false,
    targetPages: [],
  }),
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
