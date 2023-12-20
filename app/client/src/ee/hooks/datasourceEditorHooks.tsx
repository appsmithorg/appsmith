export * from "ce/hooks/datasourceEditorHooks";
import type { HeaderActionProps } from "ce/hooks/datasourceEditorHooks";
import { useHeaderActions as useHeaderActionsCE } from "ce/hooks/datasourceEditorHooks";
import React from "react";
import { EditorNames } from ".";
import type { Datasource } from "entities/Datasource";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateDatasourceActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import NewReusableActionButton from "@appsmith/pages/Editor/PackageEditor/DataSourceEditor/NewReusableActionButton";

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
