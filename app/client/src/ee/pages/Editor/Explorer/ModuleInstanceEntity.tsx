export * from "ce/pages/Editor/Explorer/ModuleInstanceEntity";

import React, { memo, useCallback } from "react";
import history, { NavigationMethod } from "utils/history";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { AppState } from "@appsmith/reducers";
import type { PluginType } from "entities/Action";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import {
  // getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import Entity from "pages/Editor/Explorer/Entity";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
// import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { Icon } from "design-system";

interface ExplorerModuleInstanceEntityProps {
  step: number;
  searchKeyword?: string;
  id: string;
  isActive: boolean;
  type: PluginType;
}

const onUpdateModuleInstanceName = (id: string, name: string) => {
  return { id, name }; // ankita: update later
};

export const ExplorerModuleInstanceEntity = memo(
  (props: ExplorerModuleInstanceEntityProps) => {
    const pageId = useSelector(getCurrentPageId);
    const moduleInstance = useSelector((state: AppState) =>
      getModuleInstanceById(state, props.id),
    );
    const navigateToUrl = moduleInstanceEditorURL({
      pageId,
      moduleInstanceId: moduleInstance?.id || "",
      params: {},
    });
    const navigateToModuleInstance = useCallback(() => {
      if (moduleInstance?.id) {
        history.push(navigateToUrl, {
          invokedBy: NavigationMethod.EntityExplorer,
        });
      }
    }, [moduleInstance?.id, navigateToUrl]);

    const moduleInstancePermissions = moduleInstance?.userPermissions || [];

    const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

    /* const canDeleteModuleInstance = getHasDeleteActionPermission(
      isFeatureEnabled,
      moduleInstancePermissions,
    ); */

    const canManageModuleInstance = getHasManageActionPermission(
      isFeatureEnabled,
      moduleInstancePermissions,
    );

    if (!moduleInstance) return null;

    const contextMenu = <div />;
    return (
      <Entity
        action={navigateToModuleInstance}
        active={props.isActive}
        canEditEntityName={canManageModuleInstance}
        className="t--moduleInstance"
        contextMenu={contextMenu}
        entityId={moduleInstance.id}
        icon={<Icon name="module" />}
        key={moduleInstance.id}
        name={moduleInstance.name}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={onUpdateModuleInstanceName}
      />
    );
  },
);

ExplorerModuleInstanceEntity.displayName = "ExplorerModuleInstanceEntity";

export default ExplorerModuleInstanceEntity;
