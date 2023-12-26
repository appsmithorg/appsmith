import React, { useCallback, useMemo } from "react";
import { resolveAsSpaceChar } from "utils/helpers";
import {
  hasDeleteModulePermission,
  hasManageModulePermission,
} from "@appsmith/utils/permissionHelpers";
import { saveModuleName } from "@appsmith/actions/moduleActions";
import { StyledEntity as Entity } from "pages/Editor/Explorer/Common/components";
import history, { NavigationMethod } from "utils/history";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import ModuleEntityContextMenu from "./ModuleEntityContextMenu";
import { moduleEditorURL } from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
import type { Dictionary } from "lodash";
import { keyBy } from "lodash";
import { PluginType } from "entities/Action";
import {
  ENTITY_ICON_SIZE,
  EntityIcon,
  JsFileIconV2,
  dbQueryIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { ExtendedModule } from "../utils";

function resolveQueryModuleIcon(plugin: Plugin) {
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
}

function resolveIcon(module: ExtendedModule, pluginGroups: Dictionary<Plugin>) {
  if (module.type === MODULE_TYPE.JS) {
    return JsFileIconV2(16, 16);
  } else {
    return resolveQueryModuleIcon(pluginGroups[module.pluginId]);
  }
}

const ModuleEntity = ({
  currentModuleId,
  module,
  packageId,
}: {
  currentModuleId: string;
  module: ExtendedModule;
  packageId: string;
}) => {
  const isCurrentModule = currentModuleId === module.id;
  const modulePermissions = module.userPermissions;
  const canManageModule = hasManageModulePermission(modulePermissions);
  const canDeleteModule = hasDeleteModulePermission(modulePermissions);
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = resolveIcon(module, pluginGroups);

  const contextMenu = useMemo(
    () => (
      <ModuleEntityContextMenu
        canDeleteModule={canDeleteModule}
        canManageModule={canManageModule}
        className={EntityClassNames.CONTEXT_MENU}
        id={module.id}
        key={module.id + "_context-menu"}
        name={module.name}
      />
    ),
    [canDeleteModule, canManageModule, module.id, module.name, packageId],
  );

  const switchModule = useCallback(() => {
    const navigateToUrl = moduleEditorURL({ moduleId: module.id });
    history.push(navigateToUrl, {
      invokedBy: NavigationMethod.EntityExplorer,
    });
  }, [module.id]);

  return (
    <Entity
      action={switchModule}
      active={isCurrentModule}
      canEditEntityName={canManageModule}
      className={`module ${isCurrentModule && "activeModule"}`}
      contextMenu={contextMenu}
      entityId={module.id}
      icon={icon}
      isDefaultExpanded={isCurrentModule}
      key={module.id}
      name={module.name}
      onNameEdit={resolveAsSpaceChar}
      searchKeyword={""}
      step={1}
      updateEntityName={(id, name) =>
        saveModuleName({
          id,
          name,
        })
      }
    />
  );
};

export default ModuleEntity;
