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
import { CreateApplicationFormValues } from "pages/Applications/helpers";

const initialState: ApplicationsReduxState = {
  isFetchingApplications: false,
  isSavingAppName: false,
  isFetchingApplication: false,
  isChangingViewAccess: false,
  applicationList: [],
  creatingApplication: {},
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
  [ReduxActionTypes.GET_ALL_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isFetchingApplications: true }),
  [ReduxActionTypes.FETCH_USER_APPLICATIONS_ORGS_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: any }>,
  ) => {
    return {
      ...state,
      isFetchingApplications: false,
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
    action: ReduxAction<CreateApplicationFormValues>,
  ) => {
    const updatedCreatingApplication = { ...state.creatingApplication };
    updatedCreatingApplication[action.payload.orgId] = true;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
    };
  },
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ orgId: string; application: ApplicationPayload }>,
  ) => {
    const _organizations = state.userOrgs.map((org: Organization) => {
      if (org.organization.id === action.payload.orgId) {
        const applications = org.applications;
        applications.push(action.payload.application);
        org.applications = [...applications];
        return {
          ...org,
        };
      }
      return org;
    });

    const updatedCreatingApplication = { ...state.creatingApplication };
    updatedCreatingApplication[action.payload.orgId] = false;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
      applicationList: [...state.applicationList, action.payload.application],
      userOrgs: _organizations,
    };
  },
  [ReduxActionErrorTypes.CREATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ orgId: string }>,
  ) => {
    const updatedCreatingApplication = { ...state.creatingApplication };
    updatedCreatingApplication[action.payload.orgId] = false;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
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
    const _organizations = state.userOrgs.map((org: Organization) => {
      const appIndex = org.applications.findIndex(
        app => app.id === action.payload.id,
      );
      const { id, ...rest } = action.payload;
      if (appIndex !== -1) {
        // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
        isSavingAppName = action.payload.name !== undefined;
        org.applications[appIndex] = {
          ...org.applications[appIndex],
          ...rest,
        };
      }

      return org;
    });

    return {
      ...state,
      userOrgs: _organizations,
      isSavingAppName: true,
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

export type creatingApplicationMap = Record<string, boolean>;

export interface ApplicationsReduxState {
  applicationList: ApplicationPayload[];
  searchKeyword?: string;
  isFetchingApplications: boolean;
  isSavingAppName: boolean;
  isFetchingApplication: boolean;
  isChangingViewAccess: boolean;
  creatingApplication: creatingApplicationMap;
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
