import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { applyChange, Diff } from "deep-diff";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { createImmerReducer } from "utils/ReducerUtils";
import * as Sentry from "@sentry/react";

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
    if (updates.length === 0) {
      return state;
    }
    for (const update of updates) {
      // Null check for typescript
      if (!Array.isArray(update.path) || update.path.length === 0) {
        continue;
      }
      try {
        applyChange(state, undefined, update);
      } catch (e) {
        Sentry.captureException(e, {
          extra: {
            update,
            updateLength: updates.length,
          },
        });
      }
    }
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
