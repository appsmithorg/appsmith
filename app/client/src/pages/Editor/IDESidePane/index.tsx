import React from "react";
import WidgetsEditorEntityExplorer from "../WidgetsEditorEntityExplorer";
import { useSelector } from "react-redux";
import { getIsAppSidebarEnabled } from "selectors/ideSelectors";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  APP_LIBRARIES_EDITOR_PATH,
  APP_SETTINGS_EDITOR_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
} from "constants/routes";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import AppSettingsPane from "../AppSettingsPane";

const SidePaneContainer = styled.div`
  height: 100%;
  width: 256px;
  border-right: 1px solid var(--ads-v2-color-border);
`;

const SettingsPane = () => {
  return (
    <div className="h-full flex">
      <div style={{ width: APP_SETTINGS_PANE_WIDTH }}>
        <AppSettingsPane />
      </div>
    </div>
  );
};

const IDESidePane = () => {
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);
  const { path } = useRouteMatch();
  if (!isAppSidebarEnabled) {
    return <WidgetsEditorEntityExplorer />;
  }
  return (
    <Switch>
      <SentryRoute
        component={SidePaneContainer}
        exact
        path={[
          `${path}${DATA_SOURCES_EDITOR_LIST_PATH}`,
          `${path}${DATA_SOURCES_EDITOR_ID_PATH}`,
        ]}
      />
      <SentryRoute
        component={SidePaneContainer}
        exact
        path={`${path}${APP_LIBRARIES_EDITOR_PATH}`}
      />
      <SentryRoute
        component={SettingsPane}
        exact
        path={`${path}${APP_SETTINGS_EDITOR_PATH}`}
      />
      <SentryRoute component={WidgetsEditorEntityExplorer} />
    </Switch>
  );
};

export default IDESidePane;
