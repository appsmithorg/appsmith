import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DependencyMap } from "../../utils/DynamicBindingUtils";

export type EvaluationDependencyState = {
  dependencyMap: DependencyMap;
  inverseDependencyMap: DependencyMap;
  dependencyTree: Array<[string, string]>;
};

const initialState: EvaluationDependencyState = {
  dependencyMap: {},
  inverseDependencyMap: {},
  dependencyTree: [],
};

const evaluationDependencyReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATION_DEPENDENCY_MAP]: (
    state: EvaluationDependencyState,
    action: ReduxAction<{
      dependencyMap: DependencyMap;
      inverseDependencyMap: DependencyMap;
    }>,
  ): EvaluationDependencyState => ({
    ...state,
    ...action.payload,
  }),
});

export default evaluationDependencyReducer;
