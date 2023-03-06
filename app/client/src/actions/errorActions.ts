import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const flushErrors = () => {
  return {
    type: ReduxActionTypes.FLUSH_ERRORS,
  };
};

export const flushErrorsAndRedirect = (url: string, inNewTab = false) => {
  return {
    type: ReduxActionTypes.FLUSH_AND_REDIRECT,
    payload: {
      url,
      inNewTab,
    },
  };
};
