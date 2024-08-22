import type { SetLintErrorsAction } from "actions/lintingActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { isEqual } from "lodash";
import type { LintError } from "utils/DynamicBindingUtils";
import { createImmerReducer } from "utils/ReducerUtils";

export type LintErrorsStore = Record<string, LintError[]>;

const initialState: LintErrorsStore = {};

export const lintErrorReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
  [ReduxActionTypes.SET_LINT_ERRORS]: (
    state: LintErrorsStore,
    action: SetLintErrorsAction,
  ) => {
    const { errors } = action.payload;
    for (const entityPath of Object.keys(errors)) {
      const entityPathLintErrors = errors[entityPath];
      if (isEqual(entityPathLintErrors, state[entityPath])) continue;
      state[entityPath] = entityPathLintErrors;
    }
  },
});
