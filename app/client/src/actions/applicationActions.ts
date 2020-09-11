import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { UpdateApplicationPayload } from "api/ApplicationApi";

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

export const updateApplication = (
  id: string,
  data: UpdateApplicationPayload,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APPLICATION,
    payload: {
      id,
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
