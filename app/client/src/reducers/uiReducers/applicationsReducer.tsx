import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import { Organization } from "constants/orgConstants";
import { ERROR_MESSAGE_CREATE_APPLICATION } from "constants/messages";

const initialState: ApplicationsReduxState = {
  isFetchingApplications: false,
  applicationList: [],
  creatingApplication: false,
  deletingApplication: false,
  userOrgs: [],
};

const applicationsReducer = createReducer(initialState, {
  [ReduxActionTypes.DELETE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, deletingApplication: true };
  },
  [ReduxActionTypes.DELETE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    const _organizations = state.userOrgs.map((org: Organization) => {
      if (org.organization.id === action.payload.organizationId) {
        let applications = org.applications;

        applications = applications.filter(
          (application: ApplicationPayload) => {
            return application.id !== action.payload.id;
          },
        );

        return {
          ...org,
          applications,
        };
      }

      return org;
    });

    return {
      ...state,
      userOrgs: _organizations,
      deletingApplication: false,
    };
  },
  [ReduxActionTypes.DELETE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, deletingApplication: false };
  },
  [ReduxActionTypes.FETCH_APPLICATION_LIST_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isFetchingApplications: true }),
  [ReduxActionTypes.FETCH_APPLICATION_LIST_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: ApplicationPayload[] }>,
  ) => ({
    ...state,
    applicationList: action.payload,
    isFetchingApplications: false,
  }),
  [ReduxActionTypes.FETCH_USER_APPLICATIONS_ORGS_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: any }>,
  ) => ({
    ...state,
    userOrgs: action.payload,
  }),

  [ReduxActionTypes.FETCH_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isFetchingApplication: true }),
  [ReduxActionTypes.FETCH_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: ApplicationPayload[] }>,
  ) => ({
    ...state,
    currentApplication: action.payload,
    isFetchingApplication: false,
  }),
  [ReduxActionTypes.CREATE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    creatingApplication: true,
    createApplicationError: undefined,
  }),
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    return {
      ...state,
      creatingApplication: false,
      applicationList: [...state.applicationList, action.payload],
    };
  },
  [ReduxActionErrorTypes.CREATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      creatingApplication: false,
      createApplicationError: ERROR_MESSAGE_CREATE_APPLICATION,
    };
  },
  [ReduxActionTypes.SEARCH_APPLICATIONS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ keyword?: string }>,
  ) => {
    return {
      ...state,
      searchKeyword: action.payload.keyword,
    };
  },
});

export interface ApplicationsReduxState {
  applicationList: ApplicationPayload[];
  searchKeyword?: string;
  isFetchingApplications: boolean;
  creatingApplication: boolean;
  createApplicationError?: string;
  deletingApplication: boolean;
  currentApplication?: ApplicationPayload;
  userOrgs: any;
}

export default applicationsReducer;
