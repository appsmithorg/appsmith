import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import { Organization } from "constants/orgConstants";
import { ERROR_MESSAGE_CREATE_APPLICATION } from "constants/messages";
import { UpdateApplicationRequest } from "api/ApplicationApi";

const initialState: ApplicationsReduxState = {
  isFetchingApplications: false,
  isSavingAppName: false,
  isFetchingApplication: false,
  isChangingViewAccess: false,
  applicationList: [],
  creatingApplication: false,
  deletingApplication: false,
  duplicatingApplication: false,
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
  [ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isChangingViewAccess: true }),
  [ReduxActionTypes.CHANGE_APPVIEW_ACCESS_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ id: string; isPublic: boolean }>,
  ) => {
    return {
      ...state,
      isChangingViewAccess: false,
      currentApplication: {
        ...state.currentApplication,
        isPublic: action.payload.isPublic,
      },
    };
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
  ) => {
    return {
      ...state,
      userOrgs: action.payload,
    };
  },

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
  [ReduxActionTypes.DUPLICATE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, duplicatingApplication: true };
  },
  [ReduxActionTypes.DUPLICATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    return {
      ...state,
      duplicatingApplication: false,
      applicationList: [...state.applicationList, action.payload],
    };
  },
  [ReduxActionTypes.DUPLICATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, duplicatingApplication: false };
  },
  [ReduxActionTypes.UPDATE_APPLICATION]: (
    state: ApplicationsReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    let isSavingAppName = false;
    const _organizations = state.userOrgs.map(
      (org: Organization, index: number) => {
        const appIndex = org.applications.findIndex(
          app => app.id === action.payload.id,
        );
        const { id, ...rest } = action.payload;
        if (appIndex !== -1) {
          isSavingAppName = action.payload.name !== undefined;
          org.applications[appIndex] = {
            ...org.applications[appIndex],
            ...rest,
          };
        }

        return org;
      },
    );

    return {
      ...state,
      userOrgs: _organizations,
      isSavingAppName: isSavingAppName,
    };
  },
  [ReduxActionTypes.UPDATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, isSavingAppName: false };
  },
  [ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, isSavingAppName: false };
  },
});

export interface ApplicationsReduxState {
  applicationList: ApplicationPayload[];
  searchKeyword?: string;
  isFetchingApplications: boolean;
  isSavingAppName: boolean;
  isFetchingApplication: boolean;
  isChangingViewAccess: boolean;
  creatingApplication: boolean;
  createApplicationError?: string;
  deletingApplication: boolean;
  duplicatingApplication: boolean;
  currentApplication?: ApplicationPayload;
  userOrgs: Organization[];
}

export interface Application {
  id: string;
  name: string;
  organizationId: string;
  isPublic: boolean;
  appIsExample: boolean;
  new: boolean;
  pageCount: number;
  defaultPageId: string;
  pages: Array<{ id: string; isDefault: boolean; default: boolean }>;
  userPermissions: string[];
}

export default applicationsReducer;
