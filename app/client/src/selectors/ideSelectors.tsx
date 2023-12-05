import { createSelector } from "reselect";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

export const getIsAppSidebarAnnouncementEnabled = createSelector(
  selectFeatureFlags,
  (flags) => !!flags?.release_show_new_sidebar_announcement_enabled,
);
