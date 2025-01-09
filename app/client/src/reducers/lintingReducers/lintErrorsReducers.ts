import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import { isEqual } from "lodash";
import type { LintError, LintErrorsStore } from "./lintErrorsReducers.types";
import type { SetLintErrorsAction } from "./lintErrorsReducers.types";

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
