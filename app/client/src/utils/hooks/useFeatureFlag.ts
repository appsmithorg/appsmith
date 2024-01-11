import { useSelector } from "react-redux";
import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

export function useFeatureFlag(flagName: FeatureFlag): boolean {
  const flagValues = useSelector(selectFeatureFlags);
  if (flagName in flagValues) {
    return flagValues[flagName];
  }
  return false;
}
