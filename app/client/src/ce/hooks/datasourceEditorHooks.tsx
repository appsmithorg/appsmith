import React from "react";
import { useSelector } from "react-redux";
import NewActionButton from "pages/Editor/DataSourceEditor/NewActionButton";
import { EditorNames } from "./";
import type { Datasource } from "entities/Datasource";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { Button } from "design-system";
import {
  GENERATE_NEW_PAGE_BUTTON_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import history from "utils/history";
import { generateTemplateFormURL } from "@appsmith/RouteBuilder";
import {
  getCurrentApplication,
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useShowPageGenerationOnHeader } from "pages/Editor/DataSourceEditor/hooks";
import type { AppState } from "@appsmith/reducers";
import {
  getHasCreatePagePermission,
  hasCreateDSActionPermissionInApp,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { isEnabledForPreviewData } from "utils/editorContextUtils";
import { getPlugin } from "@appsmith/selectors/entitiesSelector";

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
  const pageId = useSelector(getCurrentPageId);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );
  const pagePermissions = useSelector((state: AppState) =>
    getPagePermissions(state),
  );
  const showGenerateButton = useShowPageGenerationOnHeader(
    datasource as Datasource,
  );

  const plugin = useSelector((state: AppState) =>
    getPlugin(state, datasource?.pluginId || ""),
  );

  const isPluginAllowedToPreviewData =
    !!plugin && isEnabledForPreviewData(datasource as Datasource, plugin);

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
          pageId,
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
        isNewQuerySecondaryButton={!!isPluginAllowedToPreviewData}
        pluginType={pluginType}
      />
    );

    const generatePageButton =
      showGenerateButton && !showReconnectButton ? (
        <Button
          className={"t--generate-template"}
          isDisabled={!canGeneratePage}
          kind="secondary"
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
  const pageId = useSelector(getCurrentPageId);

  return {
    editorId: appId || "",
    parentEntityId: pageId || "",
    parentEntityType: ActionParentEntityType.PAGE,
  };
};
