import React, { ReactNode, useMemo } from "react";
import { dbQueryIcon, ApiMethodIcon, EntityIcon } from "../ExplorerIcons";
import { PluginType } from "entities/Action";
import { generateReactKey } from "utils/generators";
import {
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
  INTEGRATION_EDITOR_URL,
  API_EDITOR_URL,
  QUERIES_EDITOR_URL,
  INTEGRATION_TABS,
} from "constants/routes";

import { ExplorerURLParams } from "../helpers";
import { Plugin } from "api/PluginApi";
import {
  SAAS_BASE_URL,
  SAAS_EDITOR_API_ID_URL,
} from "pages/Editor/SaaSEditor/constants";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { groupBy } from "lodash";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { getNextEntityName } from "utils/AppsmithUtils";
import { trimQueryString } from "utils/helpers";

// TODO [new_urls] update would break for existing paths
// using a common todo, this needs to be fixed
export type ActionGroupConfig = {
  groupName: string;
  types: PluginType[];
  icon: JSX.Element;
  key: string;
  getURL: (
    applicationId: string,
    pageId: string,
    id: string,
    pluginType: PluginType,
    plugin?: Plugin,
  ) => string;
  generateCreatePageURL: (
    applicationId: string,
    pageId: string,
    selectedTab: string,
    mode?: string,
  ) => string;
  getIcon: (action: any, plugin: Plugin, remoteIcon?: boolean) => ReactNode;
  isGroupActive: (
    params: ExplorerURLParams,
    pageId: string,
    applicationId: string,
  ) => boolean;
  isGroupExpanded: (
    params: ExplorerURLParams,
    pageId: string,
    applicationId: string,
  ) => boolean;
};

// When we have new action plugins, we can just add it to this map
// There should be no other place where we refer to the PluginType in entity explorer.
/*eslint-disable react/display-name */
export const ACTION_PLUGIN_MAP: Array<ActionGroupConfig | undefined> = [
  {
    groupName: "Datasources",
    types: [PluginType.API, PluginType.SAAS, PluginType.DB, PluginType.REMOTE],
    icon: dbQueryIcon,
    key: generateReactKey(),
    getURL: (
      applicationId: string,
      pageId: string,
      id: string,
      pluginType: PluginType,
      plugin?: Plugin,
    ) => {
      if (!!plugin && pluginType === PluginType.SAAS) {
        return SAAS_EDITOR_API_ID_URL(
          applicationId,
          pageId,
          plugin.packageName,
          id,
        );
      } else if (
        pluginType === PluginType.DB ||
        pluginType === PluginType.REMOTE
      ) {
        return QUERIES_EDITOR_ID_URL(applicationId, pageId, id);
      } else {
        return API_EDITOR_ID_URL(applicationId, pageId, id);
      }
    },
    getIcon: (action: any, plugin: Plugin, remoteIcon?: boolean) => {
      if (plugin && plugin.type === PluginType.API && !remoteIcon) {
        const method = action?.actionConfiguration?.httpMethod;
        if (method) return <ApiMethodIcon type={method} />;
      }
      if (plugin && plugin.iconLocation)
        return (
          <EntityIcon>
            <img alt="entityIcon" src={plugin.iconLocation} />
          </EntityIcon>
        );
      else if (plugin && plugin.type === PluginType.DB) return dbQueryIcon;
    },
    generateCreatePageURL: INTEGRATION_EDITOR_URL,
    isGroupActive: (
      params: ExplorerURLParams,
      pageId: string,
      applicationId: string,
    ) =>
      [
        trimQueryString(
          INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
        ),
        trimQueryString(
          INTEGRATION_EDITOR_URL(
            applicationId,
            pageId,
            INTEGRATION_TABS.ACTIVE,
          ),
        ),
        trimQueryString(API_EDITOR_URL(applicationId, pageId)),
        trimQueryString(SAAS_BASE_URL(applicationId, pageId)),
        trimQueryString(QUERIES_EDITOR_URL(applicationId, pageId)),
      ].includes(window.location.pathname),
    isGroupExpanded: (
      params: ExplorerURLParams,
      pageId: string,
      applicationId: string,
    ) =>
      window.location.pathname.indexOf(
        trimQueryString(
          INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
        ),
      ) > -1 ||
      window.location.pathname.indexOf(
        trimQueryString(
          INTEGRATION_EDITOR_URL(
            applicationId,
            pageId,
            INTEGRATION_TABS.ACTIVE,
          ),
        ),
      ) > -1 ||
      window.location.pathname.indexOf(
        trimQueryString(API_EDITOR_URL(applicationId, pageId)),
      ) > -1 ||
      window.location.pathname.indexOf(
        trimQueryString(SAAS_BASE_URL(applicationId, pageId)),
      ) > -1 ||
      window.location.pathname.indexOf(
        trimQueryString(QUERIES_EDITOR_URL(applicationId, pageId)),
      ) > -1,
  },
];

export const getActionConfig = (type: PluginType) =>
  ACTION_PLUGIN_MAP.find((configByType: ActionGroupConfig | undefined) =>
    configByType?.types.includes(type),
  );

export const useNewActionName = () => {
  // This takes into consideration only the current page widgets
  // If we're moving to a different page, there could be a widget
  // with the same name as the generated API name
  // TODO: Figure out how to handle this scenario
  const actions = useSelector((state: AppState) => state.entities.actions);
  const groupedActions = useMemo(() => {
    return groupBy(actions, "config.pageId");
  }, [actions]);
  return (
    name: string,
    destinationPageId: string,
    isCopyOperation?: boolean,
  ) => {
    const pageActions = groupedActions[destinationPageId];
    // Get action names of the destination page only
    const actionNames = pageActions
      ? pageActions.map((action: ActionData) => action.config.name)
      : [];

    return actionNames.indexOf(name) > -1
      ? getNextEntityName(
          isCopyOperation ? `${name}Copy` : name,
          actionNames,
          true,
        )
      : name;
  };
};
