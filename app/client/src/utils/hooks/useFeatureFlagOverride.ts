import type {
  FeatureFlag,
  OverriddenFeatureFlags,
} from "@appsmith/entities/FeatureFlag";
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

export const FeaturesToOverride: FeatureFlag[] = [
  "release_anvil_enabled",
  "ab_wds_enabled",
  "release_layout_conversion_enabled",
];

export const useFeatureFlagOverride = () => {
  const dispatch = useDispatch();
  const areFeatureFlagsFetched = useSelector(getFeatureFlagsFetched);
  useEffect(() => {
    if (areFeatureFlagsFetched) {
      getFeatureFlagOverrideValues().then((flagValues) => {
        const filteredFlagValues = (
          Object.entries(flagValues) as [FeatureFlag, boolean][]
        ).reduce((acc, [flagName, flagValue]) => {
          if (FeaturesToOverride.includes(flagName) && isBoolean(flagValue)) {
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
  useEffect(() => {
    // Set up a global function to toggle the override flag
    (window as any).overrideFeatureFlag = (
      featureFlagValues: OverriddenFeatureFlags,
    ) => {
      const areAllFlagsValid = (
        Object.entries(featureFlagValues) as [FeatureFlag, boolean][]
      ).every(
        ([flagName, flagValue]) =>
          FeaturesToOverride.includes(flagName) && isBoolean(flagValue),
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
