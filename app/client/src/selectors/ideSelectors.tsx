import { createSelector } from "reselect";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

export const getIsAppSidebarEnabled = createSelector(
  selectFeatureFlags,
  (flags) => !!flags?.release_app_sidebar_enabled,
);
