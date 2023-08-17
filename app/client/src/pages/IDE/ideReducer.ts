import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface IDEReduxState {
  state: IDEAppState;
}

export enum IDEAppState {
  Data = "data",
  Page = "page",
  Add = "add",
  Libraries = "libs",
  Settings = "settings",
}

const initialState: IDEReduxState = {
  state: IDEAppState.Page,
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_APP_STATE]: (
    state: IDEReduxState,
    action: ReduxAction<IDEAppState>,
  ): IDEReduxState => {
    return { ...state, state: action.payload };
  },
});

export default ideReducer;
