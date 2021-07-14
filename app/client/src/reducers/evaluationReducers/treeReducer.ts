import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { createImmerReducer, createReducer } from "utils/AppsmithUtils";
import { Diff, applyChange } from "deep-diff";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<{
      dataTree: DataTree;
      updates: Diff<DataTree, DataTree>[];
      removedPaths: [string];
    }>,
  ) => {
    const { dataTree, updates } = action.payload;
    if (Object.keys(dataTree).length) {
      return dataTree;
    }
    for (const update of updates) {
      if (!Array.isArray(update.path) || update.path.length === 0) continue; // Null check for typescript
      applyChange(state, undefined, update);
    }

    return state;
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
