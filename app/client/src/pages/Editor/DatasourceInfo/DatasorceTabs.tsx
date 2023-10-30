import React from "react";
import { VIEW_MODE_TABS } from "constants/DatasourceEditorConstants";
import { Tabs, Tab, TabsList, TabPanel } from "design-system";
import styled from "styled-components";
import {
  DATASOURCE_CONFIGURATIONS_TAB,
  DATASOURCE_VIEW_DATA_TAB,
  createMessage,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { setDatasourceViewModeFlag } from "actions/datasourceActions";
import DatasourceViewModeSchema from "./DatasourceViewModeSchema";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import { isEnvironmentValid } from "@appsmith/utils/Environments";
import type { Datasource } from "entities/Datasource";
import { isGoogleSheetPluginDS } from "utils/editorContextUtils";
import { getPluginNameFromId } from "@appsmith/selectors/entitiesSelector";
import GoogleSheetSchema from "./GoogleSheetSchema";

const TabsContainer = styled(Tabs)`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TabListWrapper = styled(TabsList)`
  flex-shrink: 0;
  margin-left: var(--ads-v2-spaces-7);
`;

const TabPanelContainer = styled(TabPanel)`
  margin-top: 0;
  overflow: hidden;
  flex-grow: 1;
`;

const ConfigurationsTabPanelContainer = styled(TabPanel)`
  margin-top: 0;
  overflow: hidden;
  flex-grow: 1;
  padding: 0 var(--ads-v2-spaces-7);
`;

interface DatasourceTabProps {
  configChild: JSX.Element;
  datasource: Datasource;
}

const DatasourceTabs = (props: DatasourceTabProps) => {
  const currentEnvironmentId = useSelector(getCurrentEnvironmentId);
  const isDatasourceValid =
    isEnvironmentValid(props.datasource, currentEnvironmentId) || false;
  const dispatch = useDispatch();
  const setDatasourceViewModeFlagClick = (value: boolean) => {
    dispatch(setDatasourceViewModeFlag(value));
  };
  const pluginName = useSelector((state) =>
    getPluginNameFromId(state, props.datasource.pluginId),
  );
  const isGoogleSheetPlugin = isGoogleSheetPluginDS(pluginName);
  return (
    <TabsContainer
      defaultValue={
        isDatasourceValid
          ? VIEW_MODE_TABS.VIEW_DATA
          : VIEW_MODE_TABS.CONFIGURATIONS
      }
    >
      <TabListWrapper className="t--datasource-tab-list">
        <Tab value={VIEW_MODE_TABS.VIEW_DATA}>
          {createMessage(DATASOURCE_VIEW_DATA_TAB)}
        </Tab>
        <Tab value={VIEW_MODE_TABS.CONFIGURATIONS}>
          {createMessage(DATASOURCE_CONFIGURATIONS_TAB)}
        </Tab>
      </TabListWrapper>
      <TabPanelContainer
        className="t--datasource-tab-container"
        value={VIEW_MODE_TABS.VIEW_DATA}
      >
        {isGoogleSheetPlugin ? (
          <GoogleSheetSchema
            datasourceId={props.datasource.id}
            pluginId={props.datasource?.pluginId}
          />
        ) : (
          <DatasourceViewModeSchema
            datasource={props.datasource}
            setDatasourceViewModeFlag={setDatasourceViewModeFlagClick}
          />
        )}
      </TabPanelContainer>
      <ConfigurationsTabPanelContainer
        className="t--datasource-tab-container"
        value={VIEW_MODE_TABS.CONFIGURATIONS}
      >
        {props.configChild}
      </ConfigurationsTabPanelContainer>
    </TabsContainer>
  );
};

export default DatasourceTabs;
