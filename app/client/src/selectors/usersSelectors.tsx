import type { AppState } from "@appsmith/reducers";
import type { User } from "constants/userConstants";
import type { PropertyPanePositionConfig } from "reducers/uiReducers/usersReducer";

export const getCurrentUser = (state: AppState): User | undefined =>
  state.ui?.users?.currentUser;
export const getCurrentUserLoading = (state: AppState): boolean =>
  state.ui.users.loadingStates.fetchingUser;
export const getUserAuthError = (state: AppState): string =>
  state.ui.users.error;
export const getUsers = (state: AppState): User[] => state.ui.users.users;
export const getProppanePreference = (
  state: AppState,
): PropertyPanePositionConfig | undefined => state.ui.users.propPanePreferences;
export const getFeatureFlagsFetched = (state: AppState) =>
  state.ui.users.featureFlag.isFetched;

export const selectFeatureFlags = (state: AppState) =>
  state.ui.users.featureFlag.data;
