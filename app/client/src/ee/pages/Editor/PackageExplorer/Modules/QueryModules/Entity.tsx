import React, { useCallback, useMemo } from "react";
import { Icon } from "design-system";
import { resolveAsSpaceChar } from "utils/helpers";
import {
  hasDeleteModulePermission,
  hasManageModulePermission,
} from "@appsmith/utils/permissionHelpers";
import { saveModuleName } from "@appsmith/actions/moduleActions";
import { StyledEntity as Entity } from "pages/Editor/Explorer/Common/components";
import history, { NavigationMethod } from "utils/history";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import QueryModuleContextMenu from "./ContextMenu";
import { moduleEditorURL } from "@appsmith/RouteBuilder";

const QueryModuleEntity = ({
  currentModuleId,
  module,
  packageId,
}: {
  currentModuleId: string;
  module: Module;
  packageId: string;
}) => {
  const icon = <Icon name="module" size={20} />;
  const isCurrentModule = currentModuleId === module.id;
  const modulePermissions = module.userPermissions;
  const canManageModule = hasManageModulePermission(modulePermissions);
  const canDeleteModule = hasDeleteModulePermission(modulePermissions);
  const contextMenu = useMemo(
    () => (
      <QueryModuleContextMenu
        canDeleteModule={canDeleteModule}
        canManageModule={canManageModule}
        className={EntityClassNames.CONTEXT_MENU}
        id={module.id}
        key={module.id + "_context-menu"}
        name={module.name}
        packageId={packageId}
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
      className={`query-module ${isCurrentModule && "activeModule"}`}
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
          id: module.id,
          name,
        })
      }
    />
  );
};

export default QueryModuleEntity;
