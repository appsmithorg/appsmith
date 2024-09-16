import { useSelector } from "react-redux";
import type { FeatureFlag } from "ee/entities/FeatureFlag";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";

export function useFeatureFlag(flagName: FeatureFlag): boolean {
  const flagValues = useSelector(selectFeatureFlags);

  if (flagName in flagValues) {
    return flagValues[flagName];
  }
  return false;
}
