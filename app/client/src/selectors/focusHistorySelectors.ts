import { AppState } from "@appsmith/reducers";
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
    return focusInfo[key];
  },
);
