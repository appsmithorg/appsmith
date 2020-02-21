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
