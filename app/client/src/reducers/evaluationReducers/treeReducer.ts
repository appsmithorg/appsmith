import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Diff } from "deep-diff";
import { applyChange } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createImmerReducer } from "utils/ReducerUtils";
import * as Sentry from "@sentry/react";
import { get } from "lodash";
import type { DiffWithReferenceState } from "workers/Evaluation/helpers";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<{
      dataTree: DataTree;
      updates: DiffWithReferenceState[];
      removedPaths: [string];
    }>,
  ) => {
    const { updates } = action.payload;
    if (!updates || updates.length === 0) {
      return state;
    }
    for (const update of updates) {
      // Null check for typescript
      if (!Array.isArray(update.path) || update.path.length === 0) {
        continue;
      }
      try {
        //these are the decompression updates, there are cases where identical values are present in the state
        //over here we have the path which has the identical value and apply as an update
        if (update.kind === "referenceState") {
          const { path, referencePath } = update;

          const patch = {
            kind: "N",
            path,
            rhs: get(state, referencePath),
          } as Diff<DataTree, DataTree>;
          applyChange(state, undefined, patch);
        } else {
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
