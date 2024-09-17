import React from "react";
import { VIEW_MODE_TABS } from "constants/DatasourceEditorConstants";
import { Tabs, Tab, TabsList, TabPanel } from "@appsmith/ads";
import styled from "styled-components";
import {
  DATASOURCE_CONFIGURATIONS_TAB,
  DATASOURCE_VIEW_DATA_TAB,
  createMessage,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { setDatasourceViewModeFlag } from "actions/datasourceActions";
import DatasourceViewModeSchema from "./DatasourceViewModeSchema";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { isEnvironmentValid } from "ee/utils/Environments";
import type { Datasource } from "entities/Datasource";
import {
  isDatasourceAuthorizedForQueryCreation,
  isGoogleSheetPluginDS,
} from "utils/editorContextUtils";
import { getPlugin } from "ee/selectors/entitiesSelector";
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
  overflow: scroll;
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
  const plugin = useSelector((state) =>
    getPlugin(state, props.datasource.pluginId),
  );
  const isGoogleSheetPlugin = isGoogleSheetPluginDS(plugin?.packageName);
  const isPluginAuthorized =
    !!plugin && !!props.datasource
      ? isDatasourceAuthorizedForQueryCreation(
          props.datasource,
          plugin,
          currentEnvironmentId,
        )
      : false;

  return (
    <TabsContainer
      defaultValue={
        isDatasourceValid || isPluginAuthorized
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
