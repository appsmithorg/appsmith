import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { applyChange, type Diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createImmerReducer } from "utils/ReducerUtils";
import { faro } from "instrumentation";

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
    const { updates } = action.payload;

    if (!updates || updates.length === 0) {
      return state;
    }

    for (const update of updates) {
      try {
        if (!update.path || update.path.length === 0) {
          continue;
        }

        applyChange(state, undefined, update);
      } catch (e) {
        if (e instanceof Error) {
          faro?.api.pushError(e, {
            type: "treeReducer",
            context: {
              update: JSON.stringify(update),
              updateLength: String(updates.length),
            },
          });
        }
      }
    }
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
  [ReduxActionTypes.RESET_DATA_TREE]: () => initialState,
});

export default evaluatedTreeReducer;
