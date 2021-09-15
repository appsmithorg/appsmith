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

export const getMessageCount = createSelector(getFilteredErrors, (errors) => {
  const errorKeys = Object.keys(errors);
  const warningsCount = errorKeys.filter((key: string) =>
    key.includes("warning"),
  ).length;
  const errorsCount = errorKeys.length - warningsCount;
  return { errors: errorsCount, warnings: warningsCount };
});
