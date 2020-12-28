import { AppState } from "reducers";

export const getSafeCrash = (state: AppState) => {
  return state.ui.errors.safeCrash;
};

export const getSafeCrashCode = (state: AppState) => {
  return state.ui.errors.safeCrashCode;
};
