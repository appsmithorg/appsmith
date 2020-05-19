import { AppState } from "reducers";
import {
  ActionDataState,
  ActionData,
} from "reducers/entityReducers/actionsReducer";
import { ActionResponse } from "api/ActionAPI";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { API_CONSTANT } from "constants/ApiEditorConstants";
import { createSelector } from "reselect";
import { Page } from "constants/ReduxActionConstants";
import { Datasource } from "api/DatasourcesApi";

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

export const getPluginIdsOfPackageNames = (
  state: AppState,
  names: Array<string>,
): Array<string> | undefined => {
  const plugins = state.entities.plugins.list.filter(plugin =>
    names.includes(plugin.packageName),
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

export const getPluginNameFromId = (state: AppState, pluginId: string) => {
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.id === pluginId,
  );

  if (!plugin) return "";
  return plugin.name;
};

export const getPluginForm = (state: AppState, pluginId: string): [] => {
  return state.entities.plugins.formConfigs[pluginId];
};

export const getActions = (state: AppState): ActionDataState =>
  state.entities.actions;

export const getDatasourceRefs = (state: AppState): any =>
  state.ui.datasourcePane.datasourceRefs;

export const getDatasource = (
  state: AppState,
  datasourceId: string,
): Partial<Datasource> | undefined =>
  state.entities.datasources.list.find(
    datasource => datasource.id === datasourceId,
  );

export const getDatasourceDraft = (state: AppState, id: string) => {
  const drafts = state.ui.datasourcePane.drafts;
  if (id in drafts) return drafts[id];
  return {};
};

export const getPlugins = (state: AppState) => state.entities.plugins.list;

export const getApiActions = (state: AppState): ActionDataState => {
  return state.entities.actions.filter((action: ActionData) => {
    return action.config.pluginType === API_CONSTANT;
  });
};

export const getQueryName = (state: AppState, actionId: string): string => {
  const action = state.entities.actions.find((action: ActionData) => {
    return action.config.id === actionId;
  });

  return action?.config.name ?? "";
};

export const getPageName = (state: AppState, pageId: string): string => {
  const page = state.entities.pageList.pages.find((page: Page) => {
    return page.pageId === pageId;
  });

  return page?.pageName ?? "";
};

export const getQueryActions = (state: AppState): ActionDataState => {
  return state.entities.actions.filter((action: ActionData) => {
    return action.config.pluginType === QUERY_CONSTANT;
  });
};
const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

export const getDatasourcePlugins = (state: AppState) => {
  return state.entities.plugins.list.filter(
    plugin => plugin?.allowUserDatasources ?? true,
  );
};

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
