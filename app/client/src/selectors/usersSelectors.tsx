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

/**
 * GHSA-j9gf-vw2f-9hrw — admin warning banner gate. Returns true only when ALL of:
 *   - the current user is an instance super user,
 *   - admin settings are visible to them (RBAC / license tier guard),
 *   - and the server explicitly reports `instanceBaseUrlConfigurationHealthy === false`.
 *
 * The explicit `=== false` (rather than `!value`) is deliberate: during a rolling
 * deploy where a newer client briefly sees an older server's response without the
 * field, `undefined === false` is `false`, so the banner stays hidden until both
 * sides are deployed.
 */
export const getShouldShowBaseUrlMissingBanner = (
  state: DefaultRootState,
): boolean => {
  const user = state.ui?.users?.currentUser;

  return Boolean(
    user?.isSuperUser &&
      user?.adminSettingsVisible &&
      user?.instanceBaseUrlConfigurationHealthy === false,
  );
};
