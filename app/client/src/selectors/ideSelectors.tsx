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

export const getActionsCount = (state: AppState, pageId: string) =>
  state.entities.actions.filter((v) => v.config.pageId === pageId).length || 0;

export const getJsActionsCount = (state: AppState, pageId: string) =>
  state.entities.jsActions.filter((v) => v.config.pageId === pageId).length ||
  0;

export const getWidgetsCount = (state: AppState, pageId: string) =>
  Object.values(state.ui.pageWidgets[pageId].dsl).filter(
    (w) => w.type !== "CANVAS_WIDGET",
  ).length || 0;
