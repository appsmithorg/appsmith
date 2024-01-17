import React, { useMemo } from "react";
import { Redirect, matchPath, useLocation } from "react-router";

import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { useSelector } from "react-redux";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { PluginType } from "entities/Action";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import { keyBy } from "lodash";
import type { Plugin } from "api/PluginApi";
import {
  getModulePublicAction,
  getModulePublicJSCollection,
} from "@appsmith/selectors/modulesSelector";
import { resolveActionURL } from "pages/Editor/Explorer/Actions/helpers";

interface ModuleEditorDefaultRedirectProps {
  module: Module;
}

interface GetUrlProps {
  id: string;
  plugin: Plugin;
  moduleId: string;
}

const getURL = ({ id, moduleId, plugin }: GetUrlProps) => {
  if (plugin.type === PluginType.JS) {
    return jsCollectionIdURL({
      moduleId,
      collectionId: id,
    });
  }

  return resolveActionURL({
    pluginType: plugin.type,
    plugin,
    id,
    parentEntityId: moduleId,
  });
};

function ModuleEditorDefaultRedirect({
  module,
}: ModuleEditorDefaultRedirectProps) {
  const { pathname } = useLocation();
  const { isExact } = matchPath(pathname, MODULE_EDITOR_PATH) || {};
  const action = useSelector((state) =>
    getModulePublicAction(state, module.id),
  );

  const jsCollection = useSelector((state) =>
    getModulePublicJSCollection(state, module.id),
  );
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const entity = action || jsCollection;

  if (!entity) return null;

  const plugin = pluginGroups[entity?.pluginId];

  if (!isExact || !plugin) return null;

  const defaultRedirectUrl = getURL({
    id: entity.id,
    plugin: pluginGroups[entity.pluginId],
    moduleId: module.id,
  });

  return <Redirect to={defaultRedirectUrl} />;
}

export default ModuleEditorDefaultRedirect;
