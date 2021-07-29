import { createSelector } from "reselect";
import { AppState } from "reducers";
import { AppCollabReducerState } from "reducers/uiReducers/appCollabReducer";

const getAppCollabState = (state: AppState) => state.ui.appCollab;

export const getRealtimeAppEditors = createSelector(
  getAppCollabState,
  (appCollab: AppCollabReducerState) => appCollab.editors,
);
