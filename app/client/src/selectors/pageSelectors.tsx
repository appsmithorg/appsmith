import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { createSelector } from "reselect";

export const getIsServerDSLMigrationsEnabled = createSelector(
  selectFeatureFlags,
  (flags) => !!flags?.release_server_dsl_migrations_enabled,
);
