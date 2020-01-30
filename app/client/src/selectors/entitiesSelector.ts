import { AppState, DataTree } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { ActionResponse } from "api/ActionAPI";

export const getDataTree = (state: AppState): DataTree => state.entities;

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

export const getActionResponses = (
  state: AppState,
): Record<string, ActionResponse | undefined> => {
  const responses: Record<string, ActionResponse | undefined> = {};
  state.entities.actions.forEach(a => {
    responses[a.config.id] = a.data;
  });
  return responses;
};
