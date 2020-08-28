import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { DataTree } from "entities/DataTree/dataTreeFactory";

const initialState: DataTree = {};

const dataTreeReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_DATA_TREE]: (
    state: DataTree,
    action: ReduxAction<DataTree>,
  ) => action.payload,
});

export default dataTreeReducer;
