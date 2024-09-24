import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { FocusEntityInfo } from "navigation/FocusEntity";

export interface FocusState {
  entityInfo: FocusEntityInfo;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>;
}

export type FocusHistory = Record<string, FocusState>;

export interface FocusHistoryState {
  history: FocusHistory;
}

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
  [ReduxActionTypes.REMOVE_FOCUS_HISTORY]: (
    state: FocusHistoryState,
    action: { payload: { key: string } },
  ) => {
    const { key } = action.payload;

    delete state.history[key];
  },
});

export default focusHistoryReducer;
