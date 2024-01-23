import { createSelector } from "reselect";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import type { AppState } from "@appsmith/reducers";
import { getPageActions } from "@appsmith/selectors/entitiesSelector";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";

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

export const getActionsCount = (pageId: string) =>
  createSelector(getPageActions(pageId), (actions) => {
    return actions.length || 0;
  });

export const getJsActionsCount = (state: AppState, pageId: string) =>
  state.entities.jsActions.filter((v) => v.config.pageId === pageId).length ||
  0;

export const getWidgetsCount = (state: AppState, pageId: string) =>
  Object.values(state.ui.pageWidgets[pageId].dsl).filter(
    (w) => w.type !== "CANVAS_WIDGET",
  ).length || 0;

export const getJSTabs = (state: AppState) =>
  state.ui.ide.tabs[EditorEntityTab.JS];

export const getQueryTabs = (state: AppState) =>
  state.ui.ide.tabs[EditorEntityTab.QUERIES];
