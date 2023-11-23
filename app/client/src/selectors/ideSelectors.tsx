import { createSelector } from "reselect";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

export const getIsAppSidebarEnabled = createSelector(
  selectFeatureFlags,
  (flags) =>
    !!flags?.release_app_sidebar_enabled || flags?.rollout_app_sidebar_enabled,
);

export const getIsAppSidebarAnnouncementEnabled = createSelector(
  selectFeatureFlags,
  (flags) => !!flags?.release_show_new_sidebar_announcement_enabled,
);
