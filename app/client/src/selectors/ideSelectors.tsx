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

export const getPagesActiveStatus = (state: AppState) =>
  state.ui.ide.pagesActive;

export const getActionsCount = (state: AppState) =>
  state.entities.actions.length || 0;

export const getJsActionsCount = (state: AppState) =>
  state.entities.jsActions.length || 0;

export const getWidgetsCount = (state: AppState) =>
  Object.values(state.entities.canvasWidgets).filter(
    (w) => w.type !== "CANVAS_WIDGET",
  ).length || 0;
