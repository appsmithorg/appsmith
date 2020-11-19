import { createReducer } from "utils/AppsmithUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type EvaluatedTreeState = {
  unevaluated: DataTree;
  evaluated: DataTree;
};

const initialState: EvaluatedTreeState = {
  unevaluated: {},
  evaluated: {},
};

const evaluatedTreeReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<DataTree>,
  ) => ({
    ...state,
    evaluated: action.payload,
  }),
  [ReduxActionTypes.SET_UNEVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<DataTree>,
  ) => ({
    ...state,
    unevaluated: action.payload,
  }),
});

export default evaluatedTreeReducer;
