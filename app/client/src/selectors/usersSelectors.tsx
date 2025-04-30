import type { DefaultRootState } from "react-redux";
import type { User } from "constants/userConstants";
import type { PropertyPanePositionConfig } from "reducers/uiReducers/usersReducer";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

export const getCurrentUser = (state: DefaultRootState): User | undefined =>
  state.ui?.users?.currentUser;

export const getCurrentUserLoading = (state: DefaultRootState): boolean =>
  state.ui.users.loadingStates.fetchingUser;

export const getUserAuthError = (state: DefaultRootState): string =>
  state.ui.users.error;

export const getUsers = (state: DefaultRootState): User[] =>
  state.ui.users.users;

export const getProppanePreference = (
  state: DefaultRootState,
): PropertyPanePositionConfig | undefined => state.ui.users.propPanePreferences;

export const getFeatureFlagsFetched = (state: DefaultRootState) =>
  state.ui.users.featureFlag.isFetched;

export const getFeatureFlagsFetching = (state: DefaultRootState) =>
  state.ui.users.featureFlag.isFetching;

export const getIsUserLoggedIn = (state: DefaultRootState): boolean =>
  state.ui.users.currentUser?.email !== ANONYMOUS_USERNAME;
