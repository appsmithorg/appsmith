import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";

export type SetLintErrorsAction = ReduxAction<{ errors: LintErrorsStore }>;
export const setLintingErrors = (
  errors: LintErrorsStore,
): ReduxAction<{ errors: LintErrorsStore }> => {
  return {
    type: ReduxActionTypes.SET_LINT_ERRORS,
    payload: { errors },
  };
};
