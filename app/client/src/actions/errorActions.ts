import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const flushErrors = () => {
  return {
    type: ReduxActionTypes.FLUSH_ERRORS,
  };
};

export const flushErrorsAndRedirect = (url: string) => {
  return {
    type: ReduxActionTypes.FLUSH_AND_REDIRECT,
    payload: {
      url,
    },
  };
};
