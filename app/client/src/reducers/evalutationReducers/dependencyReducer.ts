import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type EvaluationDependencyState = {
  dependencyMap: Record<string, Array<string>>;
  dependencyTree: Array<[string, string]>;
};

const initialState: EvaluationDependencyState = {
  dependencyMap: {},
  dependencyTree: [],
};

const evaluationDependencyReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATION_DEPENDENCIES]: (
    state: EvaluationDependencyState,
    action: ReduxAction<EvaluationDependencyState>,
  ) => action.payload,
});

export default evaluationDependencyReducer;
