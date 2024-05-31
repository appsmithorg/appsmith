import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { DependencyMap } from "utils/DynamicBindingUtils";

export interface EvaluationDependencyState {
  inverseDependencyMap: DependencyMap;
  cachedDependencies: DependencyMap | null;
}

const initialState: EvaluationDependencyState = {
  inverseDependencyMap: {},
  cachedDependencies: null,
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
  [ReduxActionTypes.SET_PAGE_DEPENDENCY_CACHE]: (
    state: EvaluationDependencyState,
    action: ReduxAction<{ dependencies: DependencyMap | null }>,
  ): EvaluationDependencyState => ({
    ...state,
    cachedDependencies: action.payload.dependencies,
  }),
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT]: (
    state: EvaluationDependencyState,
  ) => {
    return { ...state, cachedDependencies: null };
  },
});

export default evaluationDependencyReducer;
