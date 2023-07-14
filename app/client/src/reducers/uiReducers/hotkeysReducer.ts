import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type HotkeysReduxState = {
  dialogOpen: boolean;
  initialized: false;
  hotkeys: Record<string, string>;
};

const initialState: HotkeysReduxState = {
  dialogOpen: false,
  initialized: false,
  hotkeys: {},
};

export const hotkeysReducer = createReducer(initialState, {
  [ReduxActionTypes.TOGGLE_HOTKEYS_DIALOG]: (
    state: HotkeysReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, dialogOpen: action.payload };
  },
  [ReduxActionTypes.HOTKEYS_INIT]: (
    state: HotkeysReduxState,
    action: ReduxAction<Record<string, string>>,
  ) => {
    return { ...state, initialized: true, hotkeys: action.payload };
  },
});
