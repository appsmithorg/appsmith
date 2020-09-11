import { ReduxActionTypes } from "constants/ReduxActionConstants";

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

export const fetchApplications = () => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_LIST_INIT,
  };
};

export type ApplicationUpdatePayload = {
  icon?: string;
  colour?: string;
  name?: string;
};

export const updateApplication = (
  appId: string,
  data: ApplicationUpdatePayload,
) => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_LIST_INIT,
    payload: {
      appId,
      ...data,
    },
  };
};

export const fetchApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_INIT,
    payload: {
      applicationId,
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
