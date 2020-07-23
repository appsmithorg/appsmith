import React, { ReactNode } from "react";
import { apiIcon, queryIcon, MethodTag } from "../ExplorerIcons";
import { PluginType, GenericAction } from "entities/Action";
import { generateReactKey } from "utils/generators";
import { QUERIES_EDITOR_URL, API_EDITOR_URL } from "constants/routes";
import {
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import { ReduxAction, Page } from "constants/ReduxActionConstants";
import ExplorerActionsGroup from "./ActionsGroup";
import { ExplorerURLParams } from "../helpers";

export type ActionGroupConfig = {
  groupName: string;
  type: PluginType;
  icon: JSX.Element;
  key: string;
  getURL: (applicationId: string, pageId: string, id: string) => string;
  dispatchableCreateAction: (pageId: string) => ReduxAction<{ pageId: string }>;
  generateCreatePageURL: (
    applicationId: string,
    pageId: string,
    selectedPageId: string,
  ) => string;
  getIcon: (method?: string) => ReactNode;
  isGroupActive: (params: ExplorerURLParams) => boolean;
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
        type,
        icon: apiIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) => {
          return `${API_EDITOR_ID_URL(applicationId, pageId, id)}`;
        },
        getIcon: (method?: string) => {
          if (!method) return apiIcon;
          return <MethodTag type={method} />;
        },
        dispatchableCreateAction: createNewApiAction,
        generateCreatePageURL: API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
        isGroupActive: (params: ExplorerURLParams) =>
          window.location.pathname.indexOf(
            API_EDITOR_URL(params.applicationId, params.pageId),
          ) > -1,
      };
    case PluginType.DB:
      return {
        groupName: "Queries",
        type,
        icon: queryIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) =>
          `${QUERIES_EDITOR_ID_URL(applicationId, pageId, id)}`,
        getIcon: () => {
          return queryIcon;
        },
        dispatchableCreateAction: createNewQueryAction,
        generateCreatePageURL: QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
        isGroupActive: (params: ExplorerURLParams) =>
          window.location.pathname.indexOf(
            QUERIES_EDITOR_URL(params.applicationId, params.pageId),
          ) > -1,
      };
    default:
      return undefined;
  }
});

// Gets the Actions groups in the entity explorer
// ACTION_PLUGIN_MAP specifies the number of groups
// APIs, Queries, etc.
export const getActionGroups = (
  page: Page,
  actions: GenericAction[],
  step: number,
  searchKeyword?: string,
) => {
  return ACTION_PLUGIN_MAP?.map((config?: ActionGroupConfig) => {
    if (!config) return null;
    const entries = actions.filter(
      (entry: GenericAction) => entry.pluginType === config?.type,
    );

    return (
      <ExplorerActionsGroup
        key={page.pageId + "_" + config.type}
        actions={entries}
        step={step}
        searchKeyword={searchKeyword}
        page={page}
        config={config}
      />
    );
  });
};
