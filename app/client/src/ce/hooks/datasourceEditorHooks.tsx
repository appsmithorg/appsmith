import { generateTemplateFormURL } from "ee/RouteBuilder";
import {
  GENERATE_NEW_PAGE_BUTTON_TEXT,
  createMessage,
} from "ee/constants/messages";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import { getPlugin } from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  getHasCreatePagePermission,
  hasCreateDSActionPermissionInApp,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { Button } from "@appsmith/ads";
import type { Datasource } from "entities/Datasource";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import NewActionButton from "pages/Editor/DataSourceEditor/NewActionButton";
import { useShowPageGenerationOnHeader } from "pages/Editor/DataSourceEditor/hooks";
import React from "react";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import { isEnabledForPreviewData } from "utils/editorContextUtils";
import history from "utils/history";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { EditorNames } from "./";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

export interface HeaderActionProps {
  datasource: Datasource | ApiDatasourceForm | undefined;
  isPluginAuthorized: boolean;
  pluginType: string;
  showReconnectButton?: boolean;
}

export const useHeaderActions = (
  editorType: string,
  {
    datasource,
    isPluginAuthorized,
    pluginType,
    showReconnectButton = false,
  }: HeaderActionProps,
) => {
  const basePageId = useSelector(getCurrentBasePageId);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const releaseDragDropBuildingBlocks = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );
  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );
  const pagePermissions = useSelector((state: AppState) =>
    getPagePermissions(state),
  );
  const showGenerateButton = useShowPageGenerationOnHeader(
    datasource as Datasource,
  );

  // We allow creating pages basedon the datasource. However,
  // this doesn't work well with Anvil today. So, until this is fixed
  // for Anvil, we're removing the button that generates the page for users in Anvil
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const plugin = useSelector((state: AppState) =>
    getPlugin(state, datasource?.pluginId || ""),
  );

  const isPluginAllowedToPreviewData =
    !!plugin && isEnabledForPreviewData(datasource as Datasource, plugin);

  const shouldShowSecondaryGenerateButton = releaseDragDropBuildingBlocks
    ? false
    : !!isPluginAllowedToPreviewData;

  if (editorType === EditorNames.APPLICATION) {
    const canCreateDatasourceActions = hasCreateDSActionPermissionInApp({
      isEnabled: isFeatureEnabled,
      dsPermissions: datasource?.userPermissions ?? [],
      pagePermissions,
    });
    const canCreatePages = getHasCreatePagePermission(
      isFeatureEnabled,
      userAppPermissions,
    );
    const canGeneratePage = canCreateDatasourceActions && canCreatePages;

    const routeToGeneratePage = () => {
      if (!showGenerateButton) {
        // disable button when it doesn't support page generation
        return;
      }

      AnalyticsUtil.logEvent("DATASOURCE_CARD_GEN_CRUD_PAGE_ACTION");
      history.push(
        generateTemplateFormURL({
          basePageId,
          params: {
            datasourceId: (datasource as Datasource).id,
            new_page: true,
          },
        }),
      );
    };

    const newActionButton = (
      <NewActionButton
        datasource={datasource as Datasource}
        disabled={!canCreateDatasourceActions || !isPluginAuthorized}
        eventFrom="datasource-pane"
        isNewQuerySecondaryButton={shouldShowSecondaryGenerateButton}
        pluginType={pluginType}
      />
    );

    const generatePageButton =
      showGenerateButton && !showReconnectButton && !isAnvilEnabled ? (
        <Button
          className={"t--generate-template"}
          isDisabled={!canGeneratePage}
          kind="secondary"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={(e: any) => {
            e.stopPropagation();
            e.preventDefault();
            routeToGeneratePage();
          }}
          size="md"
        >
          {createMessage(GENERATE_NEW_PAGE_BUTTON_TEXT)}
        </Button>
      ) : null;

    return {
      newActionButton,
      generatePageButton,
    };
  }

  return {};
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useParentEntityInfo = (editorType: string) => {
  const appId = useSelector(getCurrentApplicationId);
  const basePageId = useSelector(getCurrentBasePageId);

  return {
    editorId: appId || "",
    parentEntityId: basePageId || "",
    parentEntityType: ActionParentEntityType.PAGE,
  };
};
