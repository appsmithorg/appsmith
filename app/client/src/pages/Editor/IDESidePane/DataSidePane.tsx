import React, { useCallback } from "react";
import styled from "styled-components";
import { Button, List, Text } from "design-system";
import { useSelector } from "react-redux";
import {
  getDatasources,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { datasourcesEditorIdURL } from "@appsmith/RouteBuilder";
import { getSelectedDatasourceId } from "../../../navigation/FocusSelectors";
import { groupBy, keyBy } from "lodash";
import { PluginType } from "entities/Action";

const PaneContainer = styled.div`
  width: 300px;
`;

const PaneHeader = styled.div`
  height: 40px;
  background: #f8fafc;
  border-bottom: 1px solid #cdd5df;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PaneBody = styled.div`
  padding: 12px;
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

const DataSidePane = () => {
  const datasources = useSelector(getDatasources);
  const plugins = useSelector(getPlugins);
  const groupedPlugins = keyBy(plugins, "id");
  const groupedDatasources = groupBy(datasources, (d) => {
    const plugin = groupedPlugins[d.pluginId];
    if (plugin.type === PluginType.SAAS || plugin.type === PluginType.REMOTE) {
      return "Integrations";
    }
    if (plugin.type === PluginType.DB) return "Databases";
    if (plugin.type === PluginType.API) return "APIs";
    return "Others";
  });
  const goToDatasource = useCallback((id: string) => {
    history.push(datasourcesEditorIdURL({ datasourceId: id }));
  }, []);
  const currentSelectedDatasource = getSelectedDatasourceId(
    window.location.pathname,
  );
  return (
    <PaneContainer>
      <PaneHeader>
        <Text kind="heading-xs">Datasources in your Workspace</Text>
        <Button kind="tertiary" startIcon="add-line" />
      </PaneHeader>
      <PaneBody>
        {datasources.length === 0 ? (
          <EmptyStateContainer>
            <Text kind="heading-xs">
              No datasources exist in your workplace.
            </Text>
            <Text kind="body-s">
              You need a datasource connection to write your first query
            </Text>
          </EmptyStateContainer>
        ) : null}
        {Object.entries(groupedDatasources).map(([key, value]) => (
          <SubListContainer key={key}>
            <Text kind="heading-xs">{key}</Text>
            <List
              items={value.map((data) => ({
                title: data.name,
                onClick: () => goToDatasource(data.id),
                description: "",
                descriptionType: "inline",
                isSelected: currentSelectedDatasource === data.id,
              }))}
            />
          </SubListContainer>
        ))}
      </PaneBody>
    </PaneContainer>
  );
};

export default DataSidePane;
