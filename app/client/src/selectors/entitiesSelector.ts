import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { ActionResponse } from "api/ActionAPI";
import { createSelector } from "reselect";

export const getEntities = (state: AppState): AppState["entities"] =>
  state.entities;

export const getPluginIdOfName = (
  state: AppState,
  name: string,
): string | undefined => {
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.name === name,
  );
  if (!plugin) return undefined;
  return plugin.id;
};

export const getActions = (state: AppState): ActionDataState =>
  state.entities.actions;

const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

export const getActionsForCurrentPage = createSelector(
  getCurrentPageId,
  getActions,
  (pageId, actions) => {
    if (!pageId) return [];
    return actions.filter(a => a.config.pageId === pageId);
  },
);

export const getActionResponses = (
  state: AppState,
): Record<string, ActionResponse | undefined> => {
  const responses: Record<string, ActionResponse | undefined> = {};
  state.entities.actions.forEach(a => {
    responses[a.config.id] = a.data;
  });
  return responses;
};
