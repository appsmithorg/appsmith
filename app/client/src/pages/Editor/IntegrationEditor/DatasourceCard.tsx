import { Datasource } from "entities/Datasource";
import { isStoredDatasource, PluginType } from "entities/Action";
import Button, { Category } from "components/ads/Button";
import React, { useCallback, useMemo, useState } from "react";
import { isNil, keyBy } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { useParams } from "react-router";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  getPluginImages,
  getQueryActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { setDatsourceEditorMode } from "actions/datasourceActions";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import { VALID_PLUGINS_FOR_TEMPLATE } from "../GeneratePage/components/GeneratePageForm";
import { getGenerateTemplateFormURL } from "../../../constants/routes";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "../SaaSEditor/constants";
import Menu from "components/ads/Menu";
import { IconSize } from "../../../components/ads/Icon";
import Icon from "components/ads/Icon";
import MenuItem from "components/ads/MenuItem";
import { deleteDatasource } from "../../../actions/datasourceActions";
import { getIsDeletingDatasource } from "../../../selectors/entitiesSelector";
import TooltipComponent from "components/ads/Tooltip";

const Wrapper = styled.div`
  padding: 18px;
  /* margin-top: 18px; */

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

const MenuWrapper = styled(Menu)`
  flex: 0;
  margin: 8px 8px;
`;

const ActionButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    //max-width: 120px;
    width: auto;
  }
  span > svg > path {
    stroke: white;
  }
`;

const DatasourceImage = styled.img`
  height: 24px;
  width: auto;
`;

const GenerateTemplateButton = styled(Button)`
  padding: 10px 20px;
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

type DatasourceCardProps = {
  datasource: Datasource;
  onCreateQuery: (datasource: Datasource, pluginType: PluginType) => void;
  isCreating?: boolean;
};

function DatasourceCard(props: DatasourceCardProps) {
  const dispatch = useDispatch();
  const [isSelected, setIsSelected] = useState(false);
  const pluginImages = useSelector(getPluginImages);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const { datasource, isCreating } = props;
  const supportTemplateGeneration =
    VALID_PLUGINS_FOR_TEMPLATE[datasource.pluginId];

  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getQueryActionsForCurrentPage);
  const queriesWithThisDatasource = queryActions.filter(
    (action) =>
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id === datasource.id,
  ).length;

  const isDeletingDatasource = useSelector(getIsDeletingDatasource);

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "queries" : "query";
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const editDatasource = useCallback(() => {
    const plugin = pluginGroups[datasource.pluginId];
    if (plugin && plugin.type === PluginType.SAAS) {
      history.push(
        SAAS_EDITOR_DATASOURCE_ID_URL(
          params.applicationId,
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
          params.applicationId,
          params.pageId,
          datasource.id,
          {
            from: "datasources",
            ...getQueryParams(),
          },
        ),
      );
    }
  }, [datasource.id, params]);

  const onCreateNewQuery = useCallback((e) => {
    e?.stopPropagation();
    setIsSelected(true);
    const plugin = pluginGroups[datasource.pluginId];
    props.onCreateQuery(datasource, plugin.type);
  }, []);

  const routeToGeneratePage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supportTemplateGeneration) {
      // disable button when it doesn't support page generation
      return;
    }

    history.push(
      `${getGenerateTemplateFormURL(
        params.applicationId,
        params.pageId,
      )}?datasourceId=${datasource.id}&new_page=true`,
    );
  };

  const deleteAction = () => {
    dispatch(deleteDatasource({ id: datasource.id }));
  };

  return (
    <Wrapper className="t--datasource" key={datasource.id}>
      <DatasourceCardMainBody>
        <DatasourceCardHeader
          className="t--datasource-name"
          onClick={editDatasource}
        >
          <div style={{ flex: 1 }}>
            <DatasourceNameWrapper>
              <DatasourceImage
                alt="Datasource"
                className="dataSourceImage"
                src={pluginImages[datasource.pluginId]}
              />
              <DatasourceName>{datasource.name}</DatasourceName>
            </DatasourceNameWrapper>
            <Queries>
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

            <ActionButton
              className="t--create-query"
              icon="plus"
              isLoading={isCreating && isSelected}
              onClick={onCreateNewQuery}
              text="New Query"
            />
          </ButtonsWrapper>
        </DatasourceCardHeader>
        <MenuWrapper
          menuItemWrapperWidth="140px"
          position={Position.LEFT_TOP}
          target={
            <MoreOptionsContainer>
              <Icon
                fillColor="#939090"
                name="comment-context-menu"
                size={IconSize.XXXL}
              />
            </MoreOptionsContainer>
          }
        >
          <MenuItem
            icon="delete"
            isLoading={isDeletingDatasource}
            onSelect={deleteAction}
            text="Delete"
          />
          <MenuItem icon="edit" onSelect={editDatasource} text="Edit" />
        </MenuWrapper>
      </DatasourceCardMainBody>
      {!isNil(currentFormConfig) && (
        <CollapseComponent title="Show More">
          <DatasourceInfo>
            {renderDatasourceSection(currentFormConfig[0], datasource)}
          </DatasourceInfo>
        </CollapseComponent>
      )}
    </Wrapper>
  );
}

export default DatasourceCard;
