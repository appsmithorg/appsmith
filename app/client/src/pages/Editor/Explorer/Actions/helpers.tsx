import type { ReactNode } from "react";
import React from "react";
import {
  dbQueryIcon,
  ApiMethodIcon,
  EntityIcon,
  ENTITY_ICON_SIZE,
} from "../ExplorerIcons";
import {
  isGraphqlPlugin,
  PluginPackageName,
  PluginType,
} from "entities/Action";
import { generateReactKey } from "utils/generators";

import type { Plugin } from "api/PluginApi";
import {
  apiEditorIdURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "@appsmith/RouteBuilder";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

// TODO [new_urls] update would break for existing paths
// using a common todo, this needs to be fixed
export interface ActionGroupConfig {
  groupName: string;
  types: PluginType[];
  icon: JSX.Element;
  key: string;
  getURL: (
    parentEntityId: string,
    id: string,
    pluginType: PluginType,
    plugin?: Plugin,
  ) => string;
  getIcon: (action: any, plugin: Plugin, remoteIcon?: boolean) => ReactNode;
}

export interface ResolveActionURLProps {
  plugin?: Plugin;
  parentEntityId: string;
  pluginType: PluginType;
  id: string;
}

export const resolveActionURL = ({
  id,
  parentEntityId,
  pluginType,
}: ResolveActionURLProps) => {
  if (pluginType === PluginType.SAAS) {
    return saasEditorApiIdURL({
      parentEntityId,
      // It is safe to assume at this date, that only Google Sheets uses and will use PluginType.SAAS
      pluginPackageName: PluginPackageName.GOOGLE_SHEETS,
      apiId: id,
    });
  } else if (
    pluginType === PluginType.DB ||
    pluginType === PluginType.REMOTE ||
    pluginType === PluginType.AI ||
    pluginType === PluginType.INTERNAL
  ) {
    return queryEditorIdURL({
      parentEntityId,
      queryId: id,
    });
  } else {
    return apiEditorIdURL({ parentEntityId, apiId: id });
  }
};

// When we have new action plugins, we can just add it to this map
// There should be no other place where we refer to the PluginType in entity explorer.
/*eslint-disable react/display-name */
export const ACTION_PLUGIN_MAP: Array<ActionGroupConfig | undefined> = [
  {
    groupName: "Datasources",
    types: [
      PluginType.API,
      PluginType.SAAS,
      PluginType.DB,
      PluginType.REMOTE,
      PluginType.AI,
      PluginType.INTERNAL,
    ],
    icon: dbQueryIcon,
    key: generateReactKey(),
    getURL: (
      parentEntityId: string,
      id: string,
      pluginType: PluginType,
      plugin?: Plugin,
    ) => {
      return resolveActionURL({ pluginType, plugin, id, parentEntityId });
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
        if (method) return ApiMethodIcon(method);
      }
      if (plugin && plugin.iconLocation)
        return (
          <EntityIcon
            height={`${ENTITY_ICON_SIZE}px`}
            width={`${ENTITY_ICON_SIZE}px`}
          >
            <img alt="entityIcon" src={getAssetUrl(plugin.iconLocation)} />
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
