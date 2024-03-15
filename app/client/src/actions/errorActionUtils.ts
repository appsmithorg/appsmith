import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface ErrorPayloadType {
  code?: number | string;
  message?: string;
  crash?: boolean;
}

export const flushErrors = () => {
  return {
    type: ReduxActionTypes.FLUSH_ERRORS,
  };
};

export const safeCrashApp = (payload: ErrorPayloadType) => {
  return {
    type: ReduxActionTypes.SAFE_CRASH_APPSMITH,
    payload,
  };
};
