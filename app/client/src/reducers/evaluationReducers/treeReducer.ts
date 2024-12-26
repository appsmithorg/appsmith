import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { applyChange } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createImmerReducer } from "utils/ReducerUtils";
import type { DiffWithNewTreeState } from "workers/Evaluation/helpers";
import { captureException } from "instrumentation";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<{
      dataTree: DataTree;
      updates: DiffWithNewTreeState[];
      removedPaths: [string];
    }>,
  ) => {
    const { updates } = action.payload;

    if (!updates || updates.length === 0) {
      return state;
    }

    for (const update of updates) {
      try {
        if (update.kind === "newTree") {
          return update.rhs;
        } else {
          if (!update.path || update.path.length === 0) {
            continue;
          }

          applyChange(state, undefined, update);
        }
      } catch (e) {
        captureException(e, {
          context: {
            update: JSON.stringify(update),
            updateLength: updates.length.toString(),
          },
        });
      }
    }
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
  [ReduxActionTypes.RESET_DATA_TREE]: () => initialState,
});

export default evaluatedTreeReducer;
