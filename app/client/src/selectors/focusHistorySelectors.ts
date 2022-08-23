import { AppState } from "reducers";
import {
  FocusHistory,
  FocusState,
} from "reducers/uiReducers/focusHistoryReducer";
import { createSelector } from "reselect";

export const getFocusInfo = (state: AppState): FocusHistory =>
  state.ui.focusHistory.history;

export const getCurrentFocusInfo = createSelector(
  getFocusInfo,
  (_state: AppState, key: string) => key,
  (focusInfo: FocusHistory, key: string): FocusState => {
    console.log({ focusInfo, key });
    return focusInfo[key];
  },
);
