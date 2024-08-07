import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { OverriddenFeatureFlags } from "utils/hooks/useFeatureFlagOverride";

export const setFeatureFlagOverridesAction = (
  overrides: OverriddenFeatureFlags,
) => {
  return {
    type: ReduxActionTypes.FETCH_OVERRIDDEN_FEATURE_FLAGS,
    payload: overrides,
  };
};

export const updateFeatureFlagOverrideAction = (
  overrides: OverriddenFeatureFlags,
) => {
  return {
    type: ReduxActionTypes.UPDATE_OVERRIDDEN_FEATURE_FLAGS,
    payload: overrides,
  };
};
