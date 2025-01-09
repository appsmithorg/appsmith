import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export type SetLintErrorsAction = ReduxAction<{ errors: LintErrorsStore }>;
export const setLintingErrors = (
  errors: LintErrorsStore,
): ReduxAction<{ errors: LintErrorsStore }> => {
  return {
    type: ReduxActionTypes.SET_LINT_ERRORS,
    payload: { errors },
  };
};
