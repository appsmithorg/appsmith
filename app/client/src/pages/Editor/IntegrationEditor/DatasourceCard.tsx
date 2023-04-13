import type { Datasource } from "entities/Datasource";
import { isStoredDatasource, PluginType } from "entities/Action";
import React, { memo, useCallback, useEffect, useState } from "react";
import { isNil } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  getPluginImages,
  getActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import history from "utils/history";
import RenderDatasourceInformation from "pages/Editor/DataSourceEditor/DatasourceSection";
import { getQueryParams } from "utils/URLUtils";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import { deleteDatasource } from "actions/datasourceActions";
import { getGenerateCRUDEnabledPluginMap } from "selectors/entitiesSelector";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import AnalyticsUtil from "utils/AnalyticsUtil";
import NewActionButton from "../DataSourceEditor/NewActionButton";
import {
  datasourcesEditorIdURL,
  generateTemplateFormURL,
  saasEditorDatasourceIdURL,
} from "RouteBuilder";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
  CONFIRM_CONTEXT_DELETING,
  GENERATE_NEW_PAGE_BUTTON_TEXT,
  RECONNECT_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { isDatasourceAuthorizedForQueryCreation } from "utils/editorContextUtils";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import {
  hasCreateDatasourceActionPermission,
  hasDeleteDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

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

const StyledMenu = styled(Menu)`
  flex: 0;
`;

const MenuWrapper = styled.div`
  display: flex;
  margin: 8px 0px;
`;

const DatasourceImage = styled.img`
  height: 18px;
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
  padding: 0 10px;
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

type DatasourceCardProps = {
  datasource: Datasource;
  plugin: Plugin;
};

function DatasourceCard(props: DatasourceCardProps) {
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );
  const { datasource, plugin } = props;
  const supportTemplateGeneration =
    !!generateCRUDSupportedPlugin[datasource.pluginId];

  const pageId = useSelector(getCurrentPageId);

  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getActionsForCurrentPage);
  const queriesWithThisDatasource = queryActions.filter(
    (action) =>
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id === datasource.id,
  ).length;

  const datasourcePermissions = datasource?.userPermissions || [];

  const pagePermissions = useSelector(getPagePermissions);

  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

  const canEditDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  const canDeleteDatasource = hasDeleteDatasourcePermission(
    datasourcePermissions,
  );

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDeletingDatasource = !!datasource.isDeleting;

  useEffect(() => {
    if (confirmDelete && !isDeletingDatasource) {
      setConfirmDelete(false);
    }
  }, [isDeletingDatasource]);

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "queries" : "query";

  const editDatasource = useCallback(() => {
    AnalyticsUtil.logEvent("DATASOURCE_CARD_EDIT_ACTION");
    if (plugin && plugin.type === PluginType.SAAS) {
      history.push(
        saasEditorDatasourceIdURL({
          pageId,
          pluginPackageName: plugin.packageName,
          datasourceId: datasource.id,
          params: {
            from: "datasources",
            viewMode: "false",
            ...getQueryParams(),
          },
        }),
      );
    } else {
      history.push(
        datasourcesEditorIdURL({
          pageId,
          datasourceId: datasource.id,
          params: {
            from: "datasources",
            viewMode: "false",
            ...getQueryParams(),
          },
        }),
      );
    }
  }, [datasource.id, plugin]);

  const routeToGeneratePage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supportTemplateGeneration) {
      // disable button when it doesn't support page generation
      return;
    }
    AnalyticsUtil.logEvent("DATASOURCE_CARD_GEN_CRUD_PAGE_ACTION");
    history.push(
      generateTemplateFormURL({
        pageId,
        params: {
          datasourceId: datasource.id,
          new_page: true,
        },
      }),
    );
  };

  const deleteAction = () => {
    if (isDeletingDatasource) return;
    AnalyticsUtil.logEvent("DATASOURCE_CARD_DELETE_ACTION");
    dispatch(deleteDatasource({ id: datasource.id }));
  };

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
            {(!datasource.isConfigured || supportTemplateGeneration) &&
              isDatasourceAuthorizedForQueryCreation(datasource, plugin) && (
                <Button
                  className={
                    datasource.isConfigured
                      ? "t--generate-template"
                      : "t--reconnect-btn"
                  }
                  kind="secondary"
                  onClick={
                    datasource.isConfigured
                      ? () => routeToGeneratePage
                      : editDatasource
                  }
                  size="md"
                >
                  {datasource.isConfigured
                    ? createMessage(GENERATE_NEW_PAGE_BUTTON_TEXT)
                    : createMessage(RECONNECT_BUTTON_TEXT)}
                </Button>
              )}
            {datasource.isConfigured && (
              <NewActionButton
                datasource={datasource}
                disabled={
                  !canCreateDatasourceActions ||
                  !isDatasourceAuthorizedForQueryCreation(datasource, plugin)
                }
                eventFrom="active-datasources"
                plugin={plugin}
              />
            )}
            {(canDeleteDatasource || canEditDatasource) && (
              <MenuWrapper className="t--datasource-menu-option">
                <StyledMenu>
                  <MenuTrigger>
                    <Button
                      isIconButton
                      kind="tertiary"
                      size="sm"
                      startIcon="comment-context-menu"
                    />
                  </MenuTrigger>
                  <MenuContent>
                    {canEditDatasource && (
                      <MenuItem
                        className="t--datasource-option-edit"
                        onSelect={editDatasource}
                        startIcon="edit"
                      >
                        Edit
                      </MenuItem>
                    )}
                    {canDeleteDatasource && (
                      <MenuItem
                        className="t--datasource-option-delete"
                        onSelect={() => {
                          if (!isDeletingDatasource) {
                            confirmDelete
                              ? deleteAction()
                              : setConfirmDelete(true);
                          }
                        }}
                        startIcon="delete"
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
      {!isNil(currentFormConfig) && (
        <CollapseComponentWrapper
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CollapseComponent
            openTitle="Show Less"
            title="Show More"
            titleStyle={{ maxWidth: 120 }}
          >
            <DatasourceInfo>
              <RenderDatasourceInformation
                config={currentFormConfig[0]}
                datasource={datasource}
              />
            </DatasourceInfo>
          </CollapseComponent>
        </CollapseComponentWrapper>
      )}
    </Wrapper>
  );
}

export default memo(DatasourceCard);
