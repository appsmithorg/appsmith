import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { EvaluationDependencyState } from "./dependencyReducer.types";

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
