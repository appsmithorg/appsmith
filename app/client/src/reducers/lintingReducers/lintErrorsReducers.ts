import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { LintError } from "utils/DynamicBindingUtils";
import { createImmerReducer } from "utils/ReducerUtils";
import { SetLintErrorsAction } from "actions/lintingActions";
import { isEmpty, isEqual } from "lodash";
import { aggregatedPathLintErrors } from "components/editorComponents/CodeEditor/lintHelpers";

export type LintErrors = {
  [path: string]: LintError[];
};

export type LintErrorsStore = Record<string, LintErrors>;

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
      const newEntityPathError = {
        ...state[entityPath],
        ...entityPathLintErrors,
      };
      if (isEmpty(aggregatedPathLintErrors(newEntityPathError))) {
        state[entityPath] && delete state[entityPath];
        continue;
      }
      if (isEqual(state[entityPath], entityPathLintErrors)) continue;
      state[entityPath] = { ...state[entityPath], ...errors[entityPath] };
    }
  },
});
