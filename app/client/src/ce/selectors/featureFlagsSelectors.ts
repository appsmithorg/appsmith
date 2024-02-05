import type { AppState } from "@appsmith/reducers";
import {
  DEFAULT_FEATURE_FLAG_VALUE,
  type FeatureFlag,
} from "@appsmith/entities/FeatureFlag";

export const selectFeatureFlags = (state: AppState) =>
  state ? DEFAULT_FEATURE_FLAG_VALUE : DEFAULT_FEATURE_FLAG_VALUE;

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
