import { createSelector } from "reselect";
import type { AppState } from "ee/reducers";
import { getPageActions } from "ee/selectors/entitiesSelector";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import { getCurrentBasePageId } from "./editorSelectors";
import type { ParentEntityIDETabs } from "../reducers/uiReducers/ideReducer";
import { get } from "lodash";

export const getIDEViewMode = (state: AppState) => state.ui.ide.view;

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
  getCurrentBasePageId,
  getIDETabs,
  (basePageId: string, tabs: ParentEntityIDETabs) =>
    get(tabs, [basePageId, EditorEntityTab.JS], []),
);

export const getQueryTabs = createSelector(
  getCurrentBasePageId,
  getIDETabs,
  (basePageId: string, tabs: ParentEntityIDETabs): string[] =>
    get(tabs, [basePageId, EditorEntityTab.QUERIES], []),
);

export const getShowCreateNewModal = (state: AppState) =>
  state.ui.ide.showCreateModal;

export const getIdeCanvasSideBySideHoverState = (state: AppState) =>
  state.ui.ide.ideCanvasSideBySideHover;

export const getListViewActiveState = (state: AppState) =>
  state.ui.ide.isListViewActive;

export const getRenameEntity = (state: AppState) => state.ui.ide.renameEntity;

export const getIsRenaming = (id: string) =>
  createSelector(getRenameEntity, (entityId) => {
    return entityId === id;
  });
