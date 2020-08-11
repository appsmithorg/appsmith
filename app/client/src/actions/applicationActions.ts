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
