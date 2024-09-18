import { createSelector } from "reselect";
import type { AppState } from "ee/reducers";
import type { AppCollabReducerState } from "reducers/uiReducers/appCollabReducer";
import { getCurrentUser } from "./usersSelectors";
import type { User } from "entities/AppCollab/CollabInterfaces";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

export const getAppCollabState = (state: AppState) => state.ui.appCollab;

export const getRealtimeAppEditors = createSelector(
  getAppCollabState,
  getCurrentUser,
  (appCollab: AppCollabReducerState, currentUser) =>
    appCollab.editors.filter((el) => el.email !== currentUser?.email),
);

export const getConcurrentPageEditors = (state: AppState) =>
  state.ui.appCollab.pageEditors;

export const isConcurrentPageEditorToastVisible = createSelector(
  getConcurrentPageEditors,
  getCurrentUser,
  (pageEditors: User[], currentUser?: User) => {
    if (
      pageEditors.length === 0 ||
      !currentUser ||
      currentUser.email === ANONYMOUS_USERNAME
    )
      return;

    return pageEditors.some(
      (editor: User) => editor.email !== currentUser?.email,
    );
  },
);
