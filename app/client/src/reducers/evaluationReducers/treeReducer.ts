import { createImmerReducer } from "utils/AppsmithUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<DataTree>,
  ) => action.payload,
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
