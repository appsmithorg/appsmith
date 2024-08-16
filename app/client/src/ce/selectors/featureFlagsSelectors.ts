import type { AppState } from "ee/reducers";
import type { FeatureFlag, FeatureFlags } from "ee/entities/FeatureFlag";
import memoize from "micro-memoize";
import type { OverriddenFeatureFlags } from "utils/hooks/useFeatureFlagOverride";

const combineFeatureFlags = memoize(
  (featureFlags: FeatureFlags, overriddenFlags: OverriddenFeatureFlags) => {
    return { ...featureFlags, ...overriddenFlags };
  },
);

export const selectFeatureFlags = (state: AppState) => {
  return combineFeatureFlags(
    state.ui.users.featureFlag.data,
    state.ui.users.featureFlag.overriddenFlags,
  );
};

export const selectFeatureFlagCheck = (
  state: AppState,
  flagName: FeatureFlag,
): boolean => {
  const flagValues = selectFeatureFlags(state);

  if (flagName in flagValues) {
    return flagValues[flagName];
  }
  return false;
};
