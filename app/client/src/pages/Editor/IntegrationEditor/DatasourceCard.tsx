import type { Datasource } from "entities/Datasource";
import { isStoredDatasource, PluginType } from "entities/Action";
import React, { memo, useCallback, useEffect, useState } from "react";
import { debounce, isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  getPluginImages,
  getCurrentActions,
} from "ee/selectors/entitiesSelector";
import styled from "styled-components";
import type { AppState } from "ee/reducers";
import history from "utils/history";
import RenderDatasourceInformation from "pages/Editor/DataSourceEditor/DatasourceSection";
import { getQueryParams } from "utils/URLUtils";
import { Button, MenuContent, MenuItem, MenuTrigger } from "@appsmith/ads";
import { deleteDatasource } from "actions/datasourceActions";
import { getGenerateCRUDEnabledPluginMap } from "ee/selectors/entitiesSelector";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import NewActionButton from "../DataSourceEditor/NewActionButton";
import {
  datasourcesEditorIdURL,
  saasEditorDatasourceIdURL,
} from "ee/RouteBuilder";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
  CONFIRM_CONTEXT_DELETING,
  GENERATE_NEW_PAGE_BUTTON_TEXT,
  RECONNECT_BUTTON_TEXT,
} from "ee/constants/messages";
import { isDatasourceAuthorizedForQueryCreation } from "utils/editorContextUtils";
import {
  getCurrentBasePageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { MenuWrapper, StyledMenu } from "components/utils/formComponents";
import { DatasourceEditEntryPoints } from "constants/Datasource";
import {
  isEnvironmentConfigured,
  doesAnyDsConfigExist,
  DB_NOT_SUPPORTED,
} from "ee/utils/Environments";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasCreatePagePermission,
  getHasDeleteDatasourcePermission,
  getHasManageDatasourcePermission,
  hasCreateDSActionPermissionInApp,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useEditorType } from "ee/hooks";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import { openGeneratePageModal } from "../GeneratePage/store/generatePageActions";

const Wrapper = styled.div`
  padding: 15px;
  cursor: pointer;
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);

    .bp3-collapse-body {
      background-color: var(--ads-v2-color-bg-subtle);
    }
  }
`;

const DatasourceCardMainBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  width: 100%;
`;

const DatasourceImage = styled.img`
  height: 34px;
  width: auto;
  margin: 0 auto;
  max-width: 100%;
`;

const DatasourceIconWrapper = styled.div`
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
`;

const DatasourceName = styled.span`
  color: var(--ads-v2-color-fg);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: -0.24px;
`;

const DatasourceCardHeader = styled.div`
  flex: 1;
  justify-content: space-between;
  display: flex;
  cursor: pointer;
`;

const DatasourceNameWrapper = styled.div`
  flex-direction: row;
  align-items: center;
  display: flex;
  gap: 13px;
`;

const DatasourceInfo = styled.div`
  padding: 0 10px 0 0;
`;

const Queries = styled.div`
  color: var(--ads-v2-color-fg-muted);
  font-size: 14px;
  display: flex;
  margin: 4px 0;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const CollapseComponentWrapper = styled.div`
  display: flex;
  width: fit-content;
`;

interface DatasourceCardProps {
  datasource: Datasource;
  plugin: Plugin;
}

function DatasourceCard(props: DatasourceCardProps) {
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );
  const { datasource, plugin } = props;
  const envSupportedDs = !DB_NOT_SUPPORTED.includes(plugin.type);

  const basePageId = useSelector(getCurrentBasePageId);

  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getCurrentActions);
  const queriesWithThisDatasource = queryActions.filter(
    (action) =>
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id === datasource.id,
  ).length;

  const datasourcePermissions = datasource?.userPermissions || [];

  const pagePermissions = useSelector(getPagePermissions);

  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const editorType = useEditorType(history.location.pathname);

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp({
    isEnabled: isFeatureEnabled,
    dsPermissions: datasourcePermissions,
    pagePermissions,
    editorType,
  });

  const canEditDatasource = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const canDeleteDatasource = getHasDeleteDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDeletingDatasource = !!datasource.isDeleting;

  const onCloseMenu = debounce(() => setConfirmDelete(false), 20);

  const supportTemplateGeneration =
    !!generateCRUDSupportedPlugin[datasource.pluginId];
  const canGeneratePage = canCreateDatasourceActions && canCreatePages;

  useEffect(() => {
    if (confirmDelete && !isDeletingDatasource) {
      setConfirmDelete(false);
    }
  }, [isDeletingDatasource]);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "queries" : "query";

  const currentEnv = useSelector(getCurrentEnvironmentId);

  const editDatasource = useCallback(() => {
    AnalyticsUtil.logEvent("DATASOURCE_CARD_EDIT_ACTION");

    if (plugin && plugin.type === PluginType.SAAS) {
      history.push(
        saasEditorDatasourceIdURL({
          basePageId,
          pluginPackageName: plugin.packageName,
          datasourceId: datasource.id,
          params: {
            from: "datasources",
            ...getQueryParams(),
          },
        }),
      );
    } else {
      history.push(
        datasourcesEditorIdURL({
          basePageId,
          datasourceId: datasource.id,
          params: {
            from: "datasources",
            viewMode: "false",
            ...getQueryParams(),
          },
        }),
      );
    }

    AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
      datasourceId: datasource?.id,
      pluginName: plugin?.name,
      entryPoint: DatasourceEditEntryPoints.DATASOURCE_CARD_EDIT,
    });
  }, [datasource.id, plugin]);

  const routeToGeneratePage = () => {
    if (!supportTemplateGeneration || !canGeneratePage) {
      // disable button when it doesn't support page generation
      return;
    }

    AnalyticsUtil.logEvent("DATASOURCE_CARD_GEN_CRUD_PAGE_ACTION");
    dispatch(
      openGeneratePageModal({
        datasourceId: datasource.id,
        new_page: true,
      }),
    );
  };

  const deleteAction = (e: Event) => {
    e.stopPropagation();

    if (isDeletingDatasource) return;

    AnalyticsUtil.logEvent("DATASOURCE_CARD_DELETE_ACTION");
    dispatch(deleteDatasource({ id: datasource.id }));
  };
  const isDSAuthorizedForQueryCreation = isDatasourceAuthorizedForQueryCreation(
    datasource,
    plugin,
    currentEnv,
  );

  const showReconnectButton = !(
    isDSAuthorizedForQueryCreation &&
    (envSupportedDs ? isEnvironmentConfigured(datasource, currentEnv) : true)
  );

  const showCreateNewActionButton = envSupportedDs
    ? doesAnyDsConfigExist(datasource)
    : true;

  return (
    <Wrapper
      className="t--datasource"
      key={datasource.id}
      onClick={editDatasource}
    >
      <DatasourceCardMainBody>
        <DatasourceCardHeader className="t--datasource-name">
          <div style={{ flex: 1 }}>
            <DatasourceNameWrapper>
              <DatasourceIconWrapper data-testid="active-datasource-icon-wrapper">
                <DatasourceImage
                  alt="Datasource"
                  data-testid="active-datasource-image"
                  src={getAssetUrl(pluginImages[datasource.pluginId])}
                />
              </DatasourceIconWrapper>
              <DatasourceName data-testid="active-datasource-name">
                {datasource.name}
              </DatasourceName>
            </DatasourceNameWrapper>
            <Queries
              className={`t--queries-for-${plugin.type}`}
              data-testid="active-datasource-queries"
            >
              {queriesWithThisDatasource
                ? `${queriesWithThisDatasource} ${QUERY} on this page`
                : "No query in this application is using this datasource"}
            </Queries>
          </div>
          <ButtonsWrapper className="action-wrapper">
            {supportTemplateGeneration &&
              !showReconnectButton &&
              !isAnvilEnabled && (
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
              )}
            {showReconnectButton && (
              <Button
                className={"t--reconnect-btn"}
                kind="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  editDatasource();
                }}
                size="md"
              >
                {createMessage(RECONNECT_BUTTON_TEXT)}
              </Button>
            )}
            {showCreateNewActionButton && (
              <NewActionButton
                datasource={datasource}
                disabled={!canCreateDatasourceActions || showReconnectButton}
                eventFrom="active-datasources"
                pluginType={plugin.type}
              />
            )}
            {(canDeleteDatasource || canEditDatasource) && (
              <MenuWrapper
                className="t--datasource-menu-option"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <StyledMenu onOpenChange={onCloseMenu}>
                  <MenuTrigger>
                    <Button
                      isIconButton
                      kind="tertiary"
                      size="md"
                      startIcon="context-menu"
                    />
                  </MenuTrigger>
                  <MenuContent align="end" style={{ minWidth: "142px" }}>
                    {canEditDatasource && (
                      <MenuItem
                        className="t--datasource-option-edit"
                        onSelect={editDatasource}
                        startIcon="pencil-line"
                      >
                        Edit
                      </MenuItem>
                    )}
                    {canDeleteDatasource && (
                      <MenuItem
                        className="t--datasource-option-delete error-menuitem"
                        disabled={isDeletingDatasource}
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        onSelect={(e: Event) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (!isDeletingDatasource) {
                            confirmDelete
                              ? deleteAction(e)
                              : setConfirmDelete(true);
                          }
                        }}
                        startIcon="delete-bin-line"
                      >
                        {isDeletingDatasource
                          ? createMessage(CONFIRM_CONTEXT_DELETING)
                          : confirmDelete
                            ? createMessage(CONFIRM_CONTEXT_DELETE)
                            : createMessage(CONTEXT_DELETE)}
                      </MenuItem>
                    )}
                  </MenuContent>
                </StyledMenu>
              </MenuWrapper>
            )}
          </ButtonsWrapper>
        </DatasourceCardHeader>
      </DatasourceCardMainBody>
      {!isEmpty(currentFormConfig) && (
        <CollapseComponentWrapper
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CollapseComponent
            openTitle="Show less"
            title="Show more"
            titleStyle={{ maxWidth: 120 }}
          >
            <DatasourceInfo>
              <RenderDatasourceInformation
                config={currentFormConfig[0]}
                datasource={datasource}
                showOnlyCurrentEnv
              />
            </DatasourceInfo>
          </CollapseComponent>
        </CollapseComponentWrapper>
      )}
    </Wrapper>
  );
}

export default memo(DatasourceCard);
