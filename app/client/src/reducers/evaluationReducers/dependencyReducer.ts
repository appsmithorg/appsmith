import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DependencyMap } from "../../utils/DynamicBindingUtils";

export type EvaluationDependencyState = {
  inverseDependencyMap: DependencyMap;
};

const initialState: EvaluationDependencyState = {
  inverseDependencyMap: {},
};

const evaluationDependencyReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATION_INVERSE_DEPENDENCY_MAP]: (
    state: EvaluationDependencyState,
    action: ReduxAction<{
      inverseDependencyMap: DependencyMap;
    }>,
  ): EvaluationDependencyState => ({
    ...state,
    inverseDependencyMap: action.payload.inverseDependencyMap,
  }),
});

export default evaluationDependencyReducer;
