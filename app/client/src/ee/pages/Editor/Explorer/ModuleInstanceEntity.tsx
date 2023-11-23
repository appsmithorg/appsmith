export * from "ce/pages/Editor/Explorer/ModuleInstanceEntity";

import React, { useCallback } from "react";
import history, { NavigationMethod } from "utils/history";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { AppState } from "@appsmith/reducers";
import type { PluginType } from "entities/Action";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import Entity, { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import { Icon } from "design-system";
import ModuleInstanceEntityContextMenu from "./ModuleInstanceEntityContextMenu";
import {
  hasDeleteModuleInstancePermission,
  hasManageModuleInstancePermission,
} from "@appsmith/utils/permissionHelpers";
import { saveModuleInstanceName } from "@appsmith/actions/moduleInstanceActions";

interface ExplorerModuleInstanceEntityProps {
  step: number;
  searchKeyword?: string;
  id: string;
  isActive: boolean;
  type: PluginType;
}

export const ExplorerModuleInstanceEntity = (
  props: ExplorerModuleInstanceEntityProps,
) => {
  const pageId = useSelector(getCurrentPageId);
  const moduleInstance = useSelector((state: AppState) =>
    getModuleInstanceById(state, props.id),
  );

  const navigateToModuleInstance = useCallback(() => {
    if (moduleInstance?.id) {
      const navigateToUrl = moduleInstanceEditorURL({
        pageId,
        moduleInstanceId: moduleInstance?.id || "",
        params: {},
      });
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EntityExplorer,
      });
    }
  }, [moduleInstance?.id, pageId]);

  const moduleInstancePermissions = moduleInstance?.userPermissions || [];

  const canDeleteModuleInstance = hasDeleteModuleInstancePermission(
    moduleInstancePermissions,
  );

  const canManageModuleInstance = hasManageModuleInstancePermission(
    moduleInstancePermissions,
  );

  if (!moduleInstance) return null;

  const contextMenu = (
    <ModuleInstanceEntityContextMenu
      canDelete={canDeleteModuleInstance}
      canManage={canManageModuleInstance}
      className={EntityClassNames.CONTEXT_MENU}
      id={moduleInstance.id}
      name={moduleInstance.name}
      pageId={pageId}
    />
  );
  return (
    <Entity
      action={navigateToModuleInstance}
      active={props.isActive}
      canEditEntityName={canManageModuleInstance}
      className="t--moduleInstance" // ankita: finalize if className or data-testid to be used for cypress
      contextMenu={contextMenu}
      entityId={moduleInstance.id}
      icon={<Icon name="module" />}
      key={moduleInstance.id}
      name={moduleInstance.name}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={(id: string, name: string) =>
        saveModuleInstanceName({
          id,
          name,
        })
      }
    />
  );
};

ExplorerModuleInstanceEntity.displayName = "ExplorerModuleInstanceEntity";

export default ExplorerModuleInstanceEntity;
