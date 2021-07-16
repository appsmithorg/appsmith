import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { applyChange, Diff } from "deep-diff";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { createImmerReducer } from "utils/AppsmithUtils";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
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
      // Null check for typescript
      if (!Array.isArray(update.path) || update.path.length === 0) {
        continue;
      }
      applyChange(state, undefined, update);
    }
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
