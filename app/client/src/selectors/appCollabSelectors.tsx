import { createSelector } from "reselect";
import { AppState } from "reducers";
import { AppCollabReducerState } from "reducers/uiReducers/appCollabReducer";
import { getCurrentUser } from "./usersSelectors";

export const getAppCollabState = (state: AppState) => state.ui.appCollab;

export const getRealtimeAppEditors = createSelector(
  getAppCollabState,
  getCurrentUser,
  (appCollab: AppCollabReducerState, currentUser) =>
    appCollab.editors.filter((el) => el.email !== currentUser?.email),
);
