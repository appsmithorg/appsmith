import { Datasource } from "entities/Datasource";
import { isStoredDatasource, PluginType } from "entities/Action";
import Button, { Category } from "components/ads/Button";
import React, { useCallback } from "react";
import { isNil } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { useParams } from "react-router";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  getPluginImages,
  getActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";
import {
  DATA_SOURCES_EDITOR_ID_URL,
  getGenerateTemplateFormURL,
} from "constants/routes";
import { setDatsourceEditorMode } from "actions/datasourceActions";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "../SaaSEditor/constants";
import Menu from "components/ads/Menu";
import { IconSize } from "../../../components/ads/Icon";
import Icon from "components/ads/Icon";
import MenuItem from "components/ads/MenuItem";
import { deleteDatasource } from "../../../actions/datasourceActions";
import {
  getGenerateCRUDEnabledPluginMap,
  getIsDeletingDatasource,
} from "../../../selectors/entitiesSelector";
import TooltipComponent from "components/ads/Tooltip";
import { GenerateCRUDEnabledPluginMap, Plugin } from "../../../api/PluginApi";
import AnalyticsUtil from "utils/AnalyticsUtil";
import NewActionButton from "../DataSourceEditor/NewActionButton";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const Wrapper = styled.div`
  padding: 18px;
  /* margin-top: 18px; */
  cursor: pointer;
  &:hover {
    background: ${Colors.Gallery};
    .bp3-collapse-body {
      background: ${Colors.Gallery};
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
  height: 24px;
  width: auto;
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
  margin-left: 10px;
  font-size: 16px;
  font-weight: 500;
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
`;

const DatasourceInfo = styled.div`
  padding: 0 10px;
`;

const Queries = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
  margin-top: 11px;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 10px;
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

  const params = useParams<{ pageId: string }>();

  const applicationId = useSelector(getCurrentApplicationId);

  const { datasource, plugin } = props;
  const supportTemplateGeneration = !!generateCRUDSupportedPlugin[
    datasource.pluginId
  ];

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

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "queries" : "query";

  const editDatasource = useCallback(() => {
    AnalyticsUtil.logEvent("DATASOURCE_CARD_EDIT_ACTION");
    if (plugin && plugin.type === PluginType.SAAS) {
      history.push(
        SAAS_EDITOR_DATASOURCE_ID_URL(
          applicationId,
          params.pageId,
          plugin.packageName,
          datasource.id,
          {
            from: "datasources",
            ...getQueryParams(),
          },
        ),
      );
    } else {
      dispatch(setDatsourceEditorMode({ id: datasource.id, viewMode: false }));
      history.push(
        DATA_SOURCES_EDITOR_ID_URL(
          applicationId,
          params.pageId,
          datasource.id,
          {
            from: "datasources",
            ...getQueryParams(),
          },
        ),
      );
    }
  }, [datasource.id, params, plugin]);

  const routeToGeneratePage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supportTemplateGeneration) {
      // disable button when it doesn't support page generation
      return;
    }
    AnalyticsUtil.logEvent("DATASOURCE_CARD_GEN_CRUD_PAGE_ACTION");
    history.push(
      getGenerateTemplateFormURL(applicationId, params.pageId, {
        datasourceId: datasource.id,
        new_page: true,
      }),
    );
  };

  const deleteAction = () => {
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
              <DatasourceImage
                alt="Datasource"
                className="dataSourceImage"
                src={pluginImages[datasource.pluginId]}
              />
              <DatasourceName>{datasource.name}</DatasourceName>
            </DatasourceNameWrapper>
            <Queries className={`t--queries-for-${plugin.type}`}>
              {queriesWithThisDatasource
                ? `${queriesWithThisDatasource} ${QUERY} on this page`
                : "No query is using this datasource"}
            </Queries>
          </div>
          <ButtonsWrapper className="action-wrapper">
            <TooltipComponent
              boundary={"viewport"}
              content="Currently not supported for page generation"
              disabled={!!supportTemplateGeneration}
              hoverOpenDelay={200}
              position={Position.BOTTOM}
            >
              <GenerateTemplateButton
                category={Category.tertiary}
                className="t--generate-template"
                disabled={!supportTemplateGeneration}
                onClick={routeToGeneratePage}
                text="GENERATE NEW PAGE"
              />
            </TooltipComponent>

            <NewActionButton
              datasource={datasource}
              eventFrom="active-datasources"
              pluginType={plugin?.type}
            />
            <MenuWrapper
              className="t--datasource-menu-option"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MenuComponent
                menuItemWrapperWidth="140px"
                position={Position.LEFT_TOP}
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
                  onSelect={deleteAction}
                  text="Delete"
                />
              </MenuComponent>
            </MenuWrapper>
          </ButtonsWrapper>
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
