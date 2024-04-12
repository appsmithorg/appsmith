import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";
import {
  setFeatureFlagOverridesAction,
  updateFeatureFlagOverrideAction,
} from "actions/featureFlagActions";
import { isBoolean } from "lodash";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFeatureFlagsFetched } from "selectors/usersSelectors";
import {
  getFeatureFlagOverrideValues,
  setFeatureFlagOverrideValues,
} from "utils/storage";

export const AvailableFeaturesToOverride: FeatureFlag[] = [
  "release_anvil_enabled",
  "release_layout_conversion_enabled",
];
export type OverriddenFeatureFlags = Partial<Record<FeatureFlag, boolean>>;

export const useFeatureFlagOverride = () => {
  const dispatch = useDispatch();
  const areFeatureFlagsFetched = useSelector(getFeatureFlagsFetched);

  /**
   * Fetches the feature flag override values and updates the state.
   */
  useEffect(() => {
    if (areFeatureFlagsFetched) {
      getFeatureFlagOverrideValues().then((flagValues) => {
        const filteredFlagValues = (
          Object.entries(flagValues) as [FeatureFlag, boolean][]
        ).reduce((acc, [flagName, flagValue]) => {
          if (
            AvailableFeaturesToOverride.includes(flagName) &&
            isBoolean(flagValue)
          ) {
            acc[flagName] = flagValues[flagName];
          }
          return acc;
        }, {} as OverriddenFeatureFlags);
        if (filteredFlagValues) {
          dispatch(setFeatureFlagOverridesAction(filteredFlagValues));
        }
      });
    }
  }, [areFeatureFlagsFetched]);

  /**
   * Sets up a global function to toggle the feature flag override.
   */
  useEffect(() => {
    (window as any).overrideFeatureFlag = (
      featureFlagValues: OverriddenFeatureFlags,
    ) => {
      const areAllFlagsValid = (
        Object.entries(featureFlagValues) as [FeatureFlag, boolean][]
      ).every(
        ([flagName, flagValue]) =>
          AvailableFeaturesToOverride.includes(flagName) &&
          isBoolean(flagValue),
      );
      if (areAllFlagsValid) {
        dispatch(updateFeatureFlagOverrideAction(featureFlagValues));
        setFeatureFlagOverrideValues(featureFlagValues);
        window.console.log(
          "Feature flag override values set to: ",
          featureFlagValues,
        );
      } else {
        window.console.error(
          "Invalid feature flag override values. Please check the feature flags being overridden.",
        );
      }
    };
  }, [dispatch]);
};
