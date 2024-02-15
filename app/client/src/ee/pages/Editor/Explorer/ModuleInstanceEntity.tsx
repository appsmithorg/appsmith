export * from "ce/pages/Editor/Explorer/ModuleInstanceEntity";

import React, { useCallback } from "react";
import history, { NavigationMethod } from "utils/history";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { AppState } from "@appsmith/reducers";
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
import styled from "styled-components";

interface StyledEntityProps {
  isInvalid: boolean;
}

const StyledEntity = styled(Entity)<StyledEntityProps>`
  & .t--entity-item,
  .t--entity-item:hover {
    ${({ isInvalid }) =>
      isInvalid && "background-color: var(--ads-v2-color-red-100) !important"}
  }

  & .t--entity-item.active {
    ${({ isInvalid }) =>
      isInvalid && "background-color: var(--ads-v2-color-red-300) !important"}
  }
`;

interface ExplorerModuleInstanceEntityProps {
  step: number;
  searchKeyword?: string;
  id: string;
  isActive: boolean;
}

export const ExplorerModuleInstanceEntity = (
  props: ExplorerModuleInstanceEntityProps,
) => {
  const pageId = useSelector(getCurrentPageId);
  const moduleInstance = useSelector((state: AppState) =>
    getModuleInstanceById(state, props.id),
  );
  const hasMissingModule = Boolean(moduleInstance?.invalids?.length);

  const navigateToModuleInstance = useCallback(() => {
    if (moduleInstance) {
      const navigateToUrl = moduleInstanceEditorURL({
        pageId,
        moduleInstanceId: moduleInstance.id,
        moduleType: moduleInstance.type,
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
      type={moduleInstance.type}
    />
  );
  return (
    <StyledEntity
      action={navigateToModuleInstance}
      active={props.isActive}
      canEditEntityName={canManageModuleInstance}
      className="t--moduleInstance" // ankita: finalize if className or data-testid to be used for cypress
      contextMenu={contextMenu}
      entityId={moduleInstance.id}
      icon={<Icon name="module" />}
      isInvalid={hasMissingModule}
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
