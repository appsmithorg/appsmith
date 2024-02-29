import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { LintErrorsStore } from "utils/DynamicBindingUtils";

export type SetLintErrorsAction = ReduxAction<{ errors: LintErrorsStore }>;
export const setLintingErrors = (
  errors: LintErrorsStore,
): ReduxAction<{ errors: LintErrorsStore }> => {
  return {
    type: ReduxActionTypes.SET_LINT_ERRORS,
    payload: { errors },
  };
};
