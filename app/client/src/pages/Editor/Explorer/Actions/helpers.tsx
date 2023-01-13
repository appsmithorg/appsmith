import React, { ReactNode, useMemo } from "react";
import { dbQueryIcon, ApiMethodIcon, EntityIcon } from "../ExplorerIcons";
import { isGraphqlPlugin, PluginType } from "entities/Action";
import { generateReactKey } from "utils/generators";

import { Plugin } from "api/PluginApi";
import { useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { groupBy } from "lodash";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  apiEditorIdURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "RouteBuilder";

// TODO [new_urls] update would break for existing paths
// using a common todo, this needs to be fixed
export type ActionGroupConfig = {
  groupName: string;
  types: PluginType[];
  icon: JSX.Element;
  key: string;
  getURL: (
    pageId: string,
    id: string,
    pluginType: PluginType,
    plugin?: Plugin,
  ) => string;
  getIcon: (action: any, plugin: Plugin, remoteIcon?: boolean) => ReactNode;
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
      pageId: string,
      id: string,
      pluginType: PluginType,
      plugin?: Plugin,
    ) => {
      if (!!plugin && pluginType === PluginType.SAAS) {
        return saasEditorApiIdURL({
          pageId,
          pluginPackageName: plugin.packageName,
          apiId: id,
        });
      } else if (
        pluginType === PluginType.DB ||
        pluginType === PluginType.REMOTE
      ) {
        return queryEditorIdURL({
          pageId,
          queryId: id,
        });
      } else {
        return apiEditorIdURL({ pageId, apiId: id });
      }
    },
    getIcon: (action: any, plugin: Plugin, remoteIcon?: boolean) => {
      const isGraphql = isGraphqlPlugin(plugin);
      if (
        plugin &&
        plugin.type === PluginType.API &&
        !remoteIcon &&
        !isGraphql
      ) {
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
