import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";

export const safeCrashAppRequest = (code?: ERROR_CODES) => {
  return {
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
    payload: {
      code,
    },
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
