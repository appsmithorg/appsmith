import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { List, Text } from "design-system";
import { useSelector } from "react-redux";
import {
  getActions,
  getDatasources,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { datasourcesEditorIdURL } from "@appsmith/RouteBuilder";
import { getSelectedDatasourceId } from "../../../../navigation/FocusSelectors";
import { countBy, groupBy, keyBy } from "lodash";
import { PluginType } from "entities/Action";
import CreateDatasourcePopover from "./CreateDatasourcePopover";
import { useLocation } from "react-router";
import {
  createMessage,
  DATA_PANE_TITLE,
  DATASOURCE_BLANK_STATE_MESSAGE,
  DATASOURCE_LIST_BLANK_TITLE,
} from "@appsmith/constants/messages";
import PaneHeader from "./PaneHeader";

const PaneContainer = styled.div`
  width: 300px;
`;

const PaneBody = styled.div`
  padding: 12px;
  height: calc(100vh - 120px);
  overflow-y: scroll;
`;

const SubListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  max-width: 300px;
`;

const DatasourceIcon = styled.img`
  height: 16px;
  width: 16px;
  align-self: flex-start;
`;

const DataSidePane = () => {
  const [currentSelectedDatasource, setCurrentSelectedDatasource] = useState<
    string | undefined
  >("");
  const datasources = useSelector(getDatasources);
  const plugins = useSelector(getPlugins);
  const groupedPlugins = keyBy(plugins, "id");
  const actions = useSelector(getActions);
  const actionCount = countBy(actions, "config.datasource.id");
  const groupedDatasources = groupBy(datasources, (d) => {
    const plugin = groupedPlugins[d.pluginId];
    if (
      plugin.type === PluginType.SAAS ||
      plugin.type === PluginType.REMOTE ||
      plugin.type === PluginType.AI
    ) {
      return "Integrations";
    }
    if (plugin.type === PluginType.DB) return "Databases";
    if (plugin.type === PluginType.API) return "APIs";
    return "Others";
  });
  const goToDatasource = useCallback((id: string) => {
    history.push(datasourcesEditorIdURL({ datasourceId: id }));
  }, []);

  const location = useLocation();
  useEffect(() => {
    setCurrentSelectedDatasource(getSelectedDatasourceId(location.pathname));
  }, [location]);

  return (
    <PaneContainer>
      <PaneHeader
        rightIcon={<CreateDatasourcePopover />}
        title={createMessage(DATA_PANE_TITLE)}
      />
      <PaneBody>
        {datasources.length === 0 ? (
          <EmptyStateContainer>
            <Text kind="heading-xs">
              {createMessage(DATASOURCE_LIST_BLANK_TITLE)}
            </Text>
            <Text kind="body-s">
              {createMessage(DATASOURCE_BLANK_STATE_MESSAGE)}
            </Text>
          </EmptyStateContainer>
        ) : null}
        {Object.entries(groupedDatasources).map(([key, value]) => (
          <SubListContainer key={key}>
            <Text kind="heading-xs">{key}</Text>
            <List
              items={value.map((data) => ({
                className: "t--datasource",
                title: data.name,
                onClick: () => goToDatasource(data.id),
                description: `${
                  actionCount[data.id] || "No"
                } queries in this app`,
                descriptionType: "block",
                isSelected: currentSelectedDatasource === data.id,
                startIcon: (
                  <DatasourceIcon
                    src={groupedPlugins[data.pluginId].iconLocation}
                  />
                ),
              }))}
            />
          </SubListContainer>
        ))}
      </PaneBody>
    </PaneContainer>
  );
};

export default DataSidePane;
