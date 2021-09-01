import { AppState } from "reducers";
import { createSelector } from "reselect";
export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
export const hideErrors = (state: AppState) => state.ui.debugger.hideErrors;
export const getFilteredErrors = createSelector(
  getDebuggerErrors,
  hideErrors,
  (errors, hideErrors) => {
    if (hideErrors) return {};

    return errors;
  },
);
