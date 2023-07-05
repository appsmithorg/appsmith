import type { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";
import { createSelector } from "reselect";

export const selectFeatureFlags = (state: AppState) =>
  state.ui.users.featureFlag.data;

export function useFeatureFlagCheck(flagName: FeatureFlag): boolean {
  const flagValues = useSelector(selectFeatureFlags);
  if (flagName in flagValues) {
    return flagValues[flagName];
  }
  return false;
}

export const datasourceEnvEnabled = createSelector(
  selectFeatureFlags,
  (flags) => {
    return !!flags.release_datasource_environments_enabled;
  },
);
