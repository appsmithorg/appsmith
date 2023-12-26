export * from "ce/hooks/datasourceEditorHooks";
import type { HeaderActionProps } from "ce/hooks/datasourceEditorHooks";
import { useHeaderActions as useHeaderActionsCE } from "ce/hooks/datasourceEditorHooks";
import React from "react";
import type { Datasource } from "entities/Datasource";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateDatasourceActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import NewReusableActionButton from "@appsmith/pages/Editor/PackageEditor/DataSourceEditor/NewReusableActionButton";
import { EditorNames } from "@appsmith/hooks";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getCurrentModuleId } from "@appsmith/selectors/modulesSelector";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";

export const useHeaderActions = (
  editorType: string,
  {
    datasource,
    isPluginAuthorized,
    pluginType,
    showReconnectButton,
  }: HeaderActionProps,
) => {
  const headerActions = useHeaderActionsCE(editorType, {
    datasource,
    isPluginAuthorized,
    pluginType,
    showReconnectButton,
  });
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const canCreateDatasourceActions = getHasCreateDatasourceActionPermission(
    isFeatureEnabled,
    datasource?.userPermissions ?? [],
  );

  if (editorType === EditorNames.APPLICATION) {
    return headerActions;
  } else if (editorType === EditorNames.PACKAGE) {
    const newActionButton = (
      <NewReusableActionButton
        datasource={datasource as Datasource}
        disabled={!canCreateDatasourceActions || !isPluginAuthorized}
        eventFrom="datasource-pane"
        pluginType={pluginType}
      />
    );

    return {
      newActionButton,
      generatePageButton: null,
    };
  }

  return {};
};

export const useParentEntityInfo = (editorType: string) => {
  const appId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const packageId = useSelector(getCurrentPackageId);
  const moduleId = useSelector(getCurrentModuleId);

  if (editorType === EditorNames.PACKAGE) {
    return {
      editorId: packageId || "",
      parentEntityId: moduleId || "",
      parentEntityType: ActionParentEntityType.MODULE,
    };
  } else {
    return {
      editorId: appId || "",
      parentEntityId: pageId || "",
      parentEntityType: ActionParentEntityType.PAGE,
    };
  }
};
