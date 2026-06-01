import type { DefaultRootState } from "react-redux";
import { memoize } from "lodash";
import type { DarkModeSetting } from "constants/AppConstants";
import { defaultDarkModeSetting } from "constants/AppConstants";
import type { LiveColorMode } from "utils/colorModeResolution";

// Memoized so a stable object reference is returned for an unchanged setting,
// matching getAppThemeSettings and avoiding needless effect/render churn.
const getMemoizedDarkModeSetting = memoize(
  (darkModeSetting: DarkModeSetting | undefined): DarkModeSetting => ({
    ...defaultDarkModeSetting,
    ...darkModeSetting,
  }),
);

/**
 * The developer-configured dark mode setting for the current application.
 * Falls back to {@link defaultDarkModeSetting} when nothing has been saved yet.
 */
export const getDarkModeSetting = (state: DefaultRootState): DarkModeSetting =>
  getMemoizedDarkModeSetting(
    state.ui.applications.currentApplication?.applicationDetail
      ?.darkModeSetting,
  );

/**
 * The live end-user color choice (tagged with its appId), set by the toggle.
 * `null` until a user picks one. Callers must check the appId matches the
 * current app — see {@link resolveColorMode}.
 */
export const getResolvedColorMode = (
  state: DefaultRootState,
): LiveColorMode | null => state.ui.applications.resolvedColorMode;
