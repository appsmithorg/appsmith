import { createSelector } from "reselect";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import type { AppState } from "@appsmith/reducers";
import { getPageActions } from "@appsmith/selectors/entitiesSelector";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { getCurrentPageId } from "./editorSelectors";
import type { ParentEntityIDETabs } from "../reducers/uiReducers/ideReducer";
import { get } from "lodash";

export const getIsSideBySideEnabled = createSelector(
  selectFeatureFlags,
  (flags) =>
    flags.release_side_by_side_ide_enabled ||
    flags.rollout_side_by_side_enabled,
);

export const getIDEViewMode = createSelector(
  getIsSideBySideEnabled,
  (state) => state.ui.ide.view,
  (featureFlag, ideViewMode) => {
    if (featureFlag) {
      return ideViewMode;
    }
    return EditorViewMode.FullScreen;
  },
);

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

export const getIDETabs = (state: AppState) => state.ui.ide.tabs;

export const getJSTabs = createSelector(
  getCurrentPageId,
  getIDETabs,
  (pageId: string, tabs: ParentEntityIDETabs) =>
    get(tabs, [pageId, EditorEntityTab.JS], []),
);

export const getQueryTabs = createSelector(
  getCurrentPageId,
  getIDETabs,
  (pageId: string, tabs: ParentEntityIDETabs): string[] =>
    get(tabs, [pageId, EditorEntityTab.QUERIES], []),
);

export const getShowCreateNewModal = (state: AppState) =>
  state.ui.ide.showCreateModal;
