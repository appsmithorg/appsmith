import type { DefaultRootState } from "react-redux";

export const getSafeCrash = (state: DefaultRootState) => {
  return state.ui.errors.safeCrash;
};

export const getSafeCrashCode = (state: DefaultRootState) => {
  return state.ui.errors.safeCrashCode;
};
