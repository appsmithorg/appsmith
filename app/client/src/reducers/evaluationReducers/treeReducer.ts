import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { original } from "immer";
import { get, set, unset } from "lodash";
import { createImmerReducer } from "utils/AppsmithUtils";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<{
      dataTree: DataTree;
      evaluationOrder: [string];
      removedPaths: [string];
    }>,
  ) => {
    const { dataTree, evaluationOrder, removedPaths } = action.payload;

    // If its the first time, return the full data tree.
    if (original(state) === initialState) {
      return dataTree;
    }

    // Removed the deleted widgets and unset properties
    removedPaths.forEach((path) => unset(state, path));

    // Selectively update the widgets to prevent all the widgets from
    // re-rendering
    const updatedEntities: Set<string> = new Set();

    // Make a list of updated entities
    evaluationOrder.forEach((path) => {
      const { entityName } = getEntityNameAndPropertyPath(path);
      updatedEntities.add(entityName);
    });

    // Update the changed entities
    updatedEntities.forEach((path) => {
      set(state, path, get(dataTree, path));
    });
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
