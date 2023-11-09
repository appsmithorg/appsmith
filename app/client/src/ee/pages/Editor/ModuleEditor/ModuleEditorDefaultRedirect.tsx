import React, { useMemo } from "react";
import { Redirect, matchPath, useLocation } from "react-router";

import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { useSelector } from "react-redux";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";
import {
  apiEditorIdURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "@appsmith/RouteBuilder";
import { keyBy } from "lodash";
import type { Plugin } from "api/PluginApi";
import { getModulePublicAction } from "@appsmith/selectors/modulesSelector";

interface ModuleEditorDefaultRedirectProps {
  module: Module;
}

interface GetUrlProps {
  id: string;
  plugin: Plugin;
}

const getURL = ({ id, plugin }: GetUrlProps) => {
  if (!!plugin && plugin.type === PluginType.SAAS) {
    return saasEditorApiIdURL({
      pluginPackageName: plugin.packageName,
      apiId: id,
    });
  } else if (
    plugin.type === PluginType.DB ||
    plugin.type === PluginType.REMOTE
  ) {
    return queryEditorIdURL({
      queryId: id,
    });
  } else {
    return apiEditorIdURL({ apiId: id });
  }
};

function ModuleEditorDefaultRedirect({
  module,
}: ModuleEditorDefaultRedirectProps) {
  const { pathname } = useLocation();
  const { isExact } = matchPath(pathname, MODULE_EDITOR_PATH) || {};
  const action: Action | undefined = useSelector((state) =>
    getModulePublicAction(state, module.id),
  );
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  if (!action) return null;

  const plugin = pluginGroups[action?.pluginId];

  if (!isExact || !plugin) return null;
  const defaultRedirectUrl = getURL({
    id: action.id,
    plugin: pluginGroups[action.pluginId],
  });

  return <Redirect to={defaultRedirectUrl} />;
}

export default ModuleEditorDefaultRedirect;
