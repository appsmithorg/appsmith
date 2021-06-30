import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { original } from "immer";
import { get, set } from "lodash";
import { createImmerReducer } from "utils/AppsmithUtils";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";

export type EvaluatedTreeState = DataTree;

const initialState: EvaluatedTreeState = {};

const evaluatedTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_TREE]: (
    state: EvaluatedTreeState,
    action: ReduxAction<{ dataTree: DataTree; evaluationOrder: [string] }>,
  ) => {
    const { dataTree, evaluationOrder } = action.payload;

    // If its the first time, return the full data tree.
    if (original(state) === initialState) {
      return dataTree;
    }

    // Selectively update the widgets to prevent all the widgets from
    // re-rendering
    const updatedEntities: Set<string> = new Set();
    // @note If more things are added outside the evaluation order that
    // affect the UI, remember to update them here.

    // Make a list of evaluation paths for updated entities
    evaluationOrder.forEach((path) => {
      const { entityName } = getEntityNameAndPropertyPath(path);
      updatedEntities.add(`${entityName}.__evaluation__`);
    });

    // Update evaluation for changed items
    updatedEntities.forEach((path) => {
      set(state, path, get(dataTree, path));
    });

    // Update all other changed entities
    evaluationOrder.forEach((path) => {
      set(state, path, get(dataTree, path));
    });
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluatedTreeReducer;
