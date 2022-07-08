import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ApplicationResponsePayload } from "api/ApplicationApi";
import {
  UpdateApplicationPayload,
  ImportApplicationRequest,
  FetchApplicationPayload,
} from "api/ApplicationApi";
import { Datasource } from "entities/Datasource";

export enum ApplicationVersion {
  DEFAULT = 1,
  SLUG_URL = 2,
}

export const setDefaultApplicationPageSuccess = (
  pageId: string,
  applicationId: string,
) => {
  return {
    type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS,
    payload: {
      pageId,
      applicationId,
    },
  };
};

export const fetchApplication = (payload: FetchApplicationPayload) => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_INIT,
    payload,
  };
};

export const updateApplicationLayout = (
  id: string,
  data: UpdateApplicationPayload,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APP_LAYOUT,
    payload: {
      id,
      ...data,
    },
  };
};

export const updateApplication = (
  id: string,
  data: UpdateApplicationPayload,
  callback?: () => void,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APPLICATION,
    payload: {
      id,
      ...data,
      callback,
    },
  };
};

export const publishApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
    payload: {
      applicationId,
    },
  };
};

export const duplicateApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.DUPLICATE_APPLICATION_INIT,
    payload: {
      applicationId,
    },
  };
};

export const importApplication = (appDetails: ImportApplicationRequest) => {
  return {
    type: ReduxActionTypes.IMPORT_APPLICATION_INIT,
    payload: appDetails,
  };
};

export const importApplicationSuccess = (
  importedApp: ApplicationResponsePayload,
) => {
  return {
    type: ReduxActionTypes.IMPORT_APPLICATION_SUCCESS,
    payload: importedApp,
  };
};

export const getAllApplications = () => {
  return {
    type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
  };
};

export const resetCurrentApplication = () => {
  return {
    type: ReduxActionTypes.RESET_CURRENT_APPLICATION,
  };
};

export const setShowAppInviteUsersDialog = (payload: boolean) => ({
  type: ReduxActionTypes.SET_SHOW_APP_INVITE_USERS_MODAL,
  payload,
});

export const initDatasourceConnectionDuringImportRequest = (
  payload: string,
) => ({
  type: ReduxActionTypes.INIT_DATASOURCE_CONNECTION_DURING_IMPORT_REQUEST,
  payload,
});

export const initDatasourceConnectionDuringImportSuccess = () => ({
  type: ReduxActionTypes.INIT_DATASOURCE_CONNECTION_DURING_IMPORT_SUCCESS,
});

export const resetDatasourceConfigForImportFetchedFlag = () => ({
  type: ReduxActionTypes.RESET_DATASOURCE_CONFIG_FETCHED_FOR_IMPORT_FLAG,
});

export const setIsReconnectingDatasourcesModalOpen = (payload: {
  isOpen: boolean;
}) => ({
  type: ReduxActionTypes.SET_IS_RECONNECTING_DATASOURCES_MODAL_OPEN,
  payload,
});

export const setWorkspaceIdForImport = (workspaceId?: string) => ({
  type: ReduxActionTypes.SET_WORKSPACE_ID_FOR_IMPORT,
  payload: workspaceId,
});

export const showReconnectDatasourceModal = (payload: {
  application: ApplicationResponsePayload;
  unConfiguredDatasourceList: Datasource[];
  workspaceId: string;
}) => ({
  type: ReduxActionTypes.SHOW_RECONNECT_DATASOURCE_MODAL,
  payload,
});
