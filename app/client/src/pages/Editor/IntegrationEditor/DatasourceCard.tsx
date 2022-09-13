import { Datasource } from "entities/Datasource";
import { isStoredDatasource, PluginType } from "entities/Action";
import React, { useCallback, useState } from "react";
import { isNil } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  getPluginImages,
  getActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "@appsmith/reducers";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";
import { setDatsourceEditorMode } from "actions/datasourceActions";
import { getQueryParams } from "utils/URLUtils";
import {
  Button,
  Category,
  Icon,
  IconSize,
  Menu,
  MenuItem,
} from "design-system";
import { deleteDatasource } from "actions/datasourceActions";
import {
  getGenerateCRUDEnabledPluginMap,
  getIsDeletingDatasource,
} from "selectors/entitiesSelector";
import { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
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
} from "@appsmith/constants/messages";
import { debounce } from "lodash";
import { getCurrentPageId } from "selectors/editorSelectors";

const Wrapper = styled.div`
  padding: 15px;
  /* margin-top: 18px; */
  cursor: pointer;

  &:hover {
    background-color: ${Colors.GREY_1};

    .bp3-collapse-body {
      background-color: ${Colors.GREY_1};
    }
  }
`;

const DatasourceCardMainBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  width: 100%;
`;

const MenuComponent = styled(Menu)`
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
  border-radius: 50%;
  background: ${Colors.GREY_2};
  display: flex;
  align-items: center;
`;

const GenerateTemplateButton = styled(Button)`
  padding: 10px 10px;
  font-size: 12px;

  &&&& {
    height: 36px;
    max-width: 200px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

const DatasourceName = styled.span`
  color: ${Colors.BLACK};
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
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: flex;
  margin: 4px 0;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const MoreOptionsContainer = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CollapseComponentWrapper = styled.div`
  display: flex;
  width: fit-content;
`;

const RedMenuItem = styled(MenuItem)`
  &&,
  && .cs-text {
    color: ${Colors.DANGER_SOLID};
  }

  &&,
  &&:hover {
    svg,
    svg path {
      fill: ${Colors.DANGER_SOLID};
    }
  }
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
  const supportTemplateGeneration = !!generateCRUDSupportedPlugin[
    datasource.pluginId
  ];

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

  const isDeletingDatasource = useSelector(getIsDeletingDatasource);

  const [confirmDelete, setConfirmDelete] = useState(false);

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
            ...getQueryParams(),
          },
        }),
      );
    } else {
      dispatch(setDatsourceEditorMode({ id: datasource.id, viewMode: false }));
      history.push(
        datasourcesEditorIdURL({
          pageId,
          datasourceId: datasource.id,
          params: {
            from: "datasources",
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

  const delayConfirmDeleteToFalse = debounce(
    () => setConfirmDelete(false),
    2200,
  );

  const deleteAction = () => {
    AnalyticsUtil.logEvent("DATASOURCE_CARD_DELETE_ACTION");
    dispatch(deleteDatasource({ id: datasource.id }));
    delayConfirmDeleteToFalse();
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
                  src={pluginImages[datasource.pluginId]}
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
          {datasource.isConfigured && (
            <ButtonsWrapper className="action-wrapper">
              {supportTemplateGeneration && (
                <GenerateTemplateButton
                  category={Category.tertiary}
                  className="t--generate-template"
                  disabled={!supportTemplateGeneration}
                  onClick={routeToGeneratePage}
                  text="GENERATE NEW PAGE"
                />
              )}
              <NewActionButton
                datasource={datasource}
                eventFrom="active-datasources"
                plugin={plugin}
              />
              <MenuWrapper
                className="t--datasource-menu-option"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MenuComponent
                  menuItemWrapperWidth="160px"
                  onClose={() => setConfirmDelete(false)}
                  position={Position.BOTTOM_RIGHT}
                  target={
                    <MoreOptionsContainer>
                      <Icon
                        fillColor={Colors.GREY_8}
                        name="comment-context-menu"
                        size={IconSize.XXXL}
                      />
                    </MoreOptionsContainer>
                  }
                >
                  <MenuItem
                    className="t--datasource-option-edit"
                    icon="edit"
                    onSelect={editDatasource}
                    text="Edit"
                  />
                  <RedMenuItem
                    className="t--datasource-option-delete"
                    icon="delete"
                    isLoading={isDeletingDatasource}
                    onSelect={() => {
                      confirmDelete ? deleteAction() : setConfirmDelete(true);
                    }}
                    text={
                      confirmDelete
                        ? createMessage(CONFIRM_CONTEXT_DELETE)
                        : createMessage(CONTEXT_DELETE)
                    }
                  />
                </MenuComponent>
              </MenuWrapper>
            </ButtonsWrapper>
          )}
          {!datasource.isConfigured && (
            <ButtonsWrapper className="action-wrapper">
              <GenerateTemplateButton
                category={Category.tertiary}
                className="t--reconnect-btn"
                onClick={editDatasource}
                text="RECONNECT"
              />

              <MenuWrapper
                className="t--datasource-menu-option"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MenuComponent
                  menuItemWrapperWidth="160px"
                  onClose={() => setConfirmDelete(false)}
                  position={Position.BOTTOM_RIGHT}
                  target={
                    <MoreOptionsContainer>
                      <Icon
                        fillColor={Colors.GRAY2}
                        name="comment-context-menu"
                        size={IconSize.XXXL}
                      />
                    </MoreOptionsContainer>
                  }
                >
                  <MenuItem
                    className="t--datasource-option-edit"
                    icon="edit"
                    onSelect={editDatasource}
                    text="Edit"
                  />
                  <RedMenuItem
                    className="t--datasource-option-delete"
                    icon="delete"
                    isLoading={isDeletingDatasource}
                    onSelect={() => {
                      confirmDelete ? deleteAction() : setConfirmDelete(true);
                    }}
                    text={
                      confirmDelete
                        ? createMessage(CONFIRM_CONTEXT_DELETE)
                        : createMessage(CONTEXT_DELETE)
                    }
                  />
                </MenuComponent>
              </MenuWrapper>
            </ButtonsWrapper>
          )}
        </DatasourceCardHeader>
      </DatasourceCardMainBody>
      {!isNil(currentFormConfig) && (
        <CollapseComponentWrapper
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CollapseComponent title="Show More" titleStyle={{ maxWidth: 120 }}>
            <DatasourceInfo>
              {renderDatasourceSection(currentFormConfig[0], datasource)}
            </DatasourceInfo>
          </CollapseComponent>
        </CollapseComponentWrapper>
      )}
    </Wrapper>
  );
}

export default DatasourceCard;
