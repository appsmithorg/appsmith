import type { AppState } from "@appsmith/reducers";
import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";

export const selectFeatureFlags = (state: AppState) =>
  state.ui.users.featureFlag.data;

// React hooks should not be placed in a selectors file.
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
