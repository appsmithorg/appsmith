import React, { ReactNode } from "react";
import { apiIcon, dbQueryIcon, MethodTag, QueryIcon } from "../ExplorerIcons";
import { PluginType } from "entities/Action";
import { generateReactKey } from "utils/generators";
import { QUERIES_EDITOR_URL, API_EDITOR_URL } from "constants/routes";
import {
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";

import { Page } from "constants/ReduxActionConstants";
import { ExplorerURLParams } from "../helpers";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import PluginGroup from "../PluginGroup/PluginGroup";
import {
  SAAS_BASE_URL,
  SAAS_EDITOR_API_ID_URL,
} from "pages/Editor/SaaSEditor/constants";

export type ActionGroupConfig = {
  groupName: string;
  types: PluginType[];
  icon: JSX.Element;
  key: string;
  getURL: (
    applicationId: string,
    pageId: string,
    id: string,
    plugin?: Plugin,
  ) => string;
  generateCreatePageURL: (
    applicationId: string,
    pageId: string,
    selectedPageId: string,
  ) => string;
  getIcon: (action: any, plugin: Plugin) => ReactNode;
  isGroupActive: (params: ExplorerURLParams, pageId: string) => boolean;
  isGroupExpanded: (params: ExplorerURLParams, pageId: string) => boolean;
};

// When we have new action plugins, we can just add it to this map
// There should be no other place where we refer to the PluginType in entity explorer.
/*eslint-disable react/display-name */
export const ACTION_PLUGIN_MAP: Array<
  ActionGroupConfig | undefined
> = Object.keys(PluginType).map((type: string) => {
  switch (type) {
    case PluginType.API:
      return {
        groupName: "APIs",
        types: [PluginType.API, PluginType.SAAS],
        icon: apiIcon,
        key: generateReactKey(),
        getURL: (
          applicationId: string,
          pageId: string,
          id: string,
          plugin?: Plugin,
        ) => {
          if (!plugin || plugin.type === PluginType.API) {
            return `${API_EDITOR_ID_URL(applicationId, pageId, id)}`;
          }
          return `${SAAS_EDITOR_API_ID_URL(
            applicationId,
            pageId,
            plugin.packageName,
            id,
          )}`;
        },
        getIcon: (action: any, plugin: Plugin) => {
          if (plugin && plugin.type === PluginType.SAAS && plugin.iconLocation)
            return <QueryIcon plugin={plugin} />;
          const method = action.actionConfiguration.httpMethod;

          if (!method) return apiIcon;
          return <MethodTag type={method} />;
        },
        generateCreatePageURL: API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
        isGroupActive: (params: ExplorerURLParams, pageId: string) =>
          [
            API_EDITOR_URL(params.applicationId, pageId),
            SAAS_BASE_URL(params.applicationId, pageId),
          ].includes(window.location.pathname),
        isGroupExpanded: (params: ExplorerURLParams, pageId: string) =>
          window.location.pathname.indexOf(
            API_EDITOR_URL(params.applicationId, pageId),
          ) > -1 ||
          window.location.pathname.indexOf(
            SAAS_BASE_URL(params.applicationId, pageId),
          ) > -1,
      };
    case PluginType.DB:
      return {
        groupName: "DB Queries",
        types: [PluginType.DB],
        icon: dbQueryIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) =>
          `${QUERIES_EDITOR_ID_URL(applicationId, pageId, id)}`,
        getIcon: (action: any, plugin: Plugin) => {
          if (plugin && plugin.iconLocation)
            return <QueryIcon plugin={plugin} />;
          return dbQueryIcon;
        },
        generateCreatePageURL: QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
        isGroupActive: (params: ExplorerURLParams, pageId: string) =>
          window.location.pathname ===
          QUERIES_EDITOR_URL(params.applicationId, pageId),
        isGroupExpanded: (params: ExplorerURLParams, pageId: string) =>
          window.location.pathname.indexOf(
            QUERIES_EDITOR_URL(params.applicationId, pageId),
          ) > -1,
      };
    default:
      return undefined;
  }
});

export const getPluginGroups = (
  page: Page,
  step: number,
  actions: any[],
  datasources: Datasource[],
  plugins: Plugin[],
  searchKeyword?: string,
  actionPluginMap = ACTION_PLUGIN_MAP,
) => {
  return actionPluginMap?.map((config?: ActionGroupConfig) => {
    if (!config) return null;

    const entries = actions?.filter((entry: any) =>
      config.types.includes(entry.config.pluginType),
    );

    const filteredPlugins = plugins.filter((plugin) =>
      config.types.includes(plugin.type),
    );

    const filteredPluginIds = filteredPlugins.map((plugin) => plugin.id);
    const filteredDatasources = datasources.filter((datasource) => {
      return filteredPluginIds.includes(datasource.pluginId);
    });

    if (
      (!entries && !filteredDatasources) ||
      (entries.length === 0 &&
        filteredDatasources.length === 0 &&
        !!searchKeyword)
    )
      return null;

    return (
      <PluginGroup
        key={page.pageId + "_" + config.types.join("_")}
        actions={entries}
        datasources={filteredDatasources}
        step={step}
        searchKeyword={searchKeyword}
        page={page}
        actionConfig={config}
      />
    );
  });
};
