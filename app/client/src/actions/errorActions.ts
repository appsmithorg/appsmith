import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ERROR_CODES } from "ee/constants/ApiConstants";
import type { ErrorPayloadType } from "sagas/ErrorSagas";

export const safeCrashAppRequest = (code?: ERROR_CODES) => {
  return {
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
    payload: {
      code,
    },
  };
};

export const safeCrashApp = (payload: ErrorPayloadType) => {
  return {
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH,
    payload,
  };
};

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
