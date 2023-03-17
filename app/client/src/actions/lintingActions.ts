import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";

export type SetLintErrorsAction = ReduxAction<{ errors: LintErrors }>;
export const setLintingErrors = (
  errors: LintErrors,
): ReduxAction<{ errors: LintErrors }> => {
  return {
    type: ReduxActionTypes.SET_LINT_ERRORS,
    payload: { errors },
  };
};
