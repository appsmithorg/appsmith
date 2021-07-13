import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { original } from "immer";
import { createImmerReducer } from "utils/AppsmithUtils";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<DataTree>,
  ) => {
    const { payload: dataTree } = action;

    const originalState = original(state) as any;
    // If its the first time, return the full data tree.
    if (originalState === initialState) {
      return dataTree;
    }

    // If the values are the same, put the current ones back in datatree and return.
    // We are doing this to make the tree in the store refer to a new object, so that
    // getDataTree will return new value??
    for (const key in originalState) {
      if (
        JSON.stringify(originalState[key]) === JSON.stringify(dataTree[key])
      ) {
        dataTree[key] = originalState[key];
      }
    }
    return dataTree;
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
