import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { APP_MODE } from "../reducers/entityReducers/appReducer";
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

export interface FetchApplicationPayload {
  applicationId: string;
  mode: APP_MODE;
}

export const fetchApplication = (
  applicationId: string,
  mode: APP_MODE,
): ReduxAction<FetchApplicationPayload> => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_INIT,
    payload: {
      applicationId,
      mode,
    },
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
