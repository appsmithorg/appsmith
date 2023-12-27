import { createSelector } from "reselect";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import type { AppState } from "@appsmith/reducers";

export const getIsAppSidebarEnabled = createSelector(
  selectFeatureFlags,
  (flags) =>
    !!flags?.release_app_sidebar_enabled || flags?.rollout_app_sidebar_enabled,
);

export const getIsAppSidebarAnnouncementEnabled = createSelector(
  selectFeatureFlags,
  (flags) => !!flags?.release_show_new_sidebar_announcement_enabled,
);

export const getIsSideBySideEnabled = createSelector(
  selectFeatureFlags,
  (flags) => flags.release_side_by_side_ide_enabled,
);

export const getIDEViewMode = (state: AppState) => state.ui.ide.view;
