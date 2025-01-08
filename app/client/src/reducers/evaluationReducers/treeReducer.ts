import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { applyChange } from "deep-diff";
import { createImmerReducer } from "utils/ReducerUtils";
import * as Sentry from "@sentry/react";
import type { EvaluatedTreeState, DiffWithNewTreeState, DataTree } from "./treeReducer.types";

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
  [ReduxActionTypes.RESET_DATA_TREE]: () => initialState,
});

export default evaluatedTreeReducer;
