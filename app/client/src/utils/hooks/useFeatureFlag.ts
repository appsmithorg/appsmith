import { useSelector } from "react-redux";
import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

export function useFeatureFlag(flagName: FeatureFlag): boolean {
  const flagValues = useSelector(selectFeatureFlags);
  if (flagName === "ab_wds_enabled") {
    return true;
  }
  if (flagName in flagValues) {
    return flagValues[flagName];
  }
  return false;
}
