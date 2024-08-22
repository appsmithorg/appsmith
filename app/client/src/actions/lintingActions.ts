import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";

export type SetLintErrorsAction = ReduxAction<{ errors: LintErrorsStore }>;
export const setLintingErrors = (
  errors: LintErrorsStore,
): ReduxAction<{ errors: LintErrorsStore }> => {
  return {
    type: ReduxActionTypes.SET_LINT_ERRORS,
    payload: { errors },
  };
};
