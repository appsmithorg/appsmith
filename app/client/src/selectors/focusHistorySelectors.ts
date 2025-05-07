import type { DefaultRootState } from "react-redux";
import type {
  FocusHistory,
  FocusState,
} from "reducers/uiReducers/focusHistoryReducer";
import { createSelector } from "reselect";

export const getFocusInfo = (state: DefaultRootState): FocusHistory =>
  state.ui.focusHistory.history;

export const getCurrentFocusInfo = createSelector(
  getFocusInfo,
  (_state: DefaultRootState, key: string) => key,
  (focusInfo: FocusHistory, key: string): FocusState => {
    return focusInfo[key];
  },
);
