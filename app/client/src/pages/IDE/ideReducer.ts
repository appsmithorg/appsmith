import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface IDEReduxState {
  sidebarWidth: number;
}

export enum IDEAppState {
  Data = "data",
  Page = "page",
  Add = "add",
  Libraries = "libs",
  Settings = "settings",
}

const initialState: IDEReduxState = {
  sidebarWidth: 300,
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_SIDEBAR_WIDTH]: (
    state: IDEReduxState,
    action: ReduxAction<number>,
  ): IDEReduxState => {
    return { ...state, sidebarWidth: action.payload };
  },
});

export default ideReducer;
