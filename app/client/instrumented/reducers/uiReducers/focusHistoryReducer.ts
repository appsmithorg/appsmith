import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { FocusEntityInfo } from "navigation/FocusEntity";

export type FocusState = {
  entityInfo: FocusEntityInfo;
  state: Record<string, any>;
};

export type FocusHistory = Record<string, FocusState>;

export type FocusHistoryState = { history: FocusHistory };

const initialState: FocusHistoryState = {
  history: {},
};

/**
 * 1. Keep adding new focus events
 * 2. Maintain a max focus list (future)
 * 3. Quick search for focus state of a entity
 * */

const focusHistoryReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_FOCUS_HISTORY]: (
    state: FocusHistoryState,
    action: { payload: { key: string; focusState: FocusState } },
  ) => {
    const { focusState, key } = action.payload;
    state.history[key] = focusState;
  },
});

export default focusHistoryReducer;
