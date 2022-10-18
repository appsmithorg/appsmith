import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { LintError } from "utils/DynamicBindingUtils";
import { createImmerReducer } from "utils/ReducerUtils";
import { SetLintErrorsAction } from "actions/lintingActions";

export interface LintErrors {
  [entityName: string]: LintError[];
}

const initialState: LintErrors = {};

export const lintErrorReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
  [ReduxActionTypes.SET_LINT_ERRORS]: (
    state: LintErrors,
    action: SetLintErrorsAction,
  ) => {
    const { errors } = action.payload;
    return {
      ...state,
      ...errors,
    };
  },
});
