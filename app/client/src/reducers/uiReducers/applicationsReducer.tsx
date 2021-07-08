import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import { Organization } from "constants/orgConstants";
import {
  createMessage,
  ERROR_MESSAGE_CREATE_APPLICATION,
} from "constants/messages";
import { UpdateApplicationRequest } from "api/ApplicationApi";
import { CreateApplicationFormValues } from "pages/Applications/helpers";
import { AppLayoutConfig } from "reducers/entityReducers/pageListReducer";

const initialState: ApplicationsReduxState = {
  isFetchingApplications: false,
  isSavingAppName: false,
  isErrorSavingAppName: false,
  isFetchingApplication: false,
  isChangingViewAccess: false,
  applicationList: [],
  creatingApplication: {},
  deletingApplication: false,
  forkingApplication: false,
  duplicatingApplication: false,
  userOrgs: [],
  isSavingOrgInfo: false,
  importingApplication: false,
  importedApplication: null,
  showAppInviteUsersDialog: false,
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
  [ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ name: string }>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      name: action.payload,
    },
  }),
  [ReduxActionTypes.CURRENT_APPLICATION_LAYOUT_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ appLayout: AppLayoutConfig }>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      appLayout: action.payload,
    },
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
      createApplicationError: createMessage(ERROR_MESSAGE_CREATE_APPLICATION),
    };
  },
  [ReduxActionTypes.FORK_APPLICATION_INIT]: (state: ApplicationsReduxState) => {
    return { ...state, forkingApplication: true };
  },
  [ReduxActionTypes.FORK_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ orgId: string; application: ApplicationPayload }>,
  ) => {
    const _organizations = state.userOrgs.map((org: Organization) => {
      if (org.organization.id === action.payload.orgId) {
        const applications = org.applications;
        org.applications = [...applications, action.payload.application];
        return {
          ...org,
        };
      }
      return org;
    });

    return {
      ...state,
      forkingApplication: false,
      applicationList: [...state.applicationList, action.payload.application],
      userOrgs: _organizations,
    };
  },
  [ReduxActionErrorTypes.FORK_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      forkingApplication: false,
    };
  },
  [ReduxActionTypes.IMPORT_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, importingApplication: true }),
  [ReduxActionTypes.IMPORT_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ importedApplication: any }>,
  ) => {
    const { importedApplication } = action.payload;
    return {
      ...state,
      importingApplication: false,
      importedApplication,
    };
  },
  [ReduxActionErrorTypes.IMPORT_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      importingApplication: false,
    };
  },
  [ReduxActionTypes.SAVING_ORG_INFO]: (state: ApplicationsReduxState) => {
    return {
      ...state,
      isSavingOrgInfo: true,
    };
  },
  [ReduxActionTypes.SAVE_ORG_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{
      id: string;
      name?: string;
      website?: string;
      email?: string;
      logoUrl?: string;
    }>,
  ) => {
    const _organizations = state.userOrgs.map((org: Organization) => {
      if (org.organization.id === action.payload.id) {
        org.organization = { ...org.organization, ...action.payload };

        return {
          ...org,
        };
      }
      return org;
    });

    return {
      ...state,
      userOrgs: _organizations,
      isSavingOrgInfo: false,
    };
  },
  [ReduxActionTypes.SAVE_ORG_ERROR]: (state: ApplicationsReduxState) => {
    return {
      ...state,
      isSavingOrgInfo: false,
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
    if (action.payload.name) {
      isSavingAppName = true;
    }
    return {
      ...state,
      isSavingAppName: isSavingAppName,
      isErrorSavingAppName: false,
    };
  },
  [ReduxActionTypes.UPDATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    // userOrgs data has to be saved to localStorage only if the action is successful
    // It introduces bug if we prematurely save it during init action.
    const { id, ...rest } = action.payload;
    const _organizations = state.userOrgs.map((org: Organization) => {
      const appIndex = org.applications.findIndex((app) => app.id === id);

      if (appIndex !== -1) {
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
      isSavingAppName: false,
      isErrorSavingAppName: false,
    };
  },
  [ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, isSavingAppName: false, isErrorSavingAppName: true };
  },
  [ReduxActionTypes.RESET_CURRENT_APPLICATION]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, currentApplication: null }),
  [ReduxActionTypes.SET_SHOW_APP_INVITE_USERS_MODAL]: (
    state: ApplicationsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    showAppInviteUsersDialog: action.payload,
  }),
});

export type creatingApplicationMap = Record<string, boolean>;

export interface ApplicationsReduxState {
  applicationList: ApplicationPayload[];
  searchKeyword?: string;
  isFetchingApplications: boolean;
  isSavingAppName: boolean;
  isErrorSavingAppName: boolean;
  isFetchingApplication: boolean;
  isChangingViewAccess: boolean;
  creatingApplication: creatingApplicationMap;
  createApplicationError?: string;
  deletingApplication: boolean;
  forkingApplication: boolean;
  duplicatingApplication: boolean;
  currentApplication?: ApplicationPayload;
  userOrgs: Organization[];
  isSavingOrgInfo: boolean;
  importingApplication: boolean;
  importedApplication: any;
  showAppInviteUsersDialog: boolean;
}

export interface Application {
  id: string;
  name: string;
  organizationId: string;
  isPublic: boolean;
  appIsExample: boolean;
  new: boolean;
  defaultPageId: string;
  pages: Array<{ id: string; isDefault: boolean; default: boolean }>;
  userPermissions: string[];
}

export default applicationsReducer;
