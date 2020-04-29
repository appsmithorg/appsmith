import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { ActionResponse } from "api/ActionAPI";
import { createSelector } from "reselect";
import { Page } from "constants/ReduxActionConstants";

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

export const getPluginIdsOfNames = (
  state: AppState,
  names: Array<string>,
): Array<string> | undefined => {
  const plugins = state.entities.plugins.list.filter(plugin =>
    names.includes(plugin.name),
  );
  const pluginIds = plugins.map(plugin => plugin.id);

  if (!pluginIds.length) return undefined;
  return pluginIds;
};

export const getPluginNameFromDatasourceId = (
  state: AppState,
  datasourceId: string,
): string | undefined => {
  const datasource = state.entities.datasources.list.find(
    datasource => datasource.id === datasourceId,
  );
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.id === datasource?.pluginId,
  );

  if (!plugin) return undefined;
  return plugin.name;
};

export const getPluginNameFromId = (state: AppState, pluginId: string) => {
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.id === pluginId,
  );

  if (!plugin) return "";
  return plugin.name;
};

export const getPluginPackageFromId = (state: AppState, pluginId: string) => {
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.id === pluginId,
  );

  if (!plugin) return "";
  return plugin.packageName;
};

export const getPluginPackageFromDatasourceId = (
  state: AppState,
  datasourceId: string,
): string | undefined => {
  const datasource = state.entities.datasources.list.find(
    datasource => datasource.id === datasourceId,
  );
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.id === datasource?.pluginId,
  );

  if (!plugin) return undefined;
  return plugin.packageName;
};

export const getPluginForm = (state: AppState, pluginId: string): [] => {
  return state.entities.plugins.formConfigs[pluginId];
};

export const getActions = (state: AppState): ActionDataState =>
  state.entities.actions;

export const getDatasourceRefs = (state: AppState): any =>
  state.ui.datasourcePane.datasourceRefs;

export const getDatasourceNames = (state: AppState): any =>
  state.entities.datasources.list.map(datasource => datasource.name);

export const getPlugins = (state: AppState) => state.entities.plugins.list;
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
