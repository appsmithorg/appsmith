import { createSelector } from "reselect";
import { selectFeatureFlags } from "../../ce/selectors/featureFlagsSelectors";

export * from "ce/selectors/featureFlagsSelectors";

export const datasourceEnvEnabled = createSelector(
  selectFeatureFlags,
  (flags) => {
    return !!flags.release_datasource_environments_enabled;
  },
);
