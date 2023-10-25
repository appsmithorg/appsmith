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
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import AppSettingsPane from "./AppSettings";
import DataSidePane from "./DataSidePane";

const SidePaneContainer = styled.div`
  height: 100%;
  min-width: 250px;
  border-right: 1px solid var(--ads-v2-color-border);
`;

const PlaceholderSidePane = styled.div`
  height: 100%;
`;

const IDESidePane = () => {
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);
  const { path } = useRouteMatch();
  if (!isAppSidebarEnabled) {
    return <WidgetsEditorEntityExplorer />;
  }
  return (
    <SidePaneContainer>
      <Switch>
        <SentryRoute
          component={DataSidePane}
          exact
          path={[
            `${path}${DATA_SOURCES_EDITOR_LIST_PATH}`,
            `${path}${DATA_SOURCES_EDITOR_ID_PATH}`,
            `${path}${INTEGRATION_EDITOR_PATH}`,
            `${path}${SAAS_GSHEET_EDITOR_ID_PATH}`,
          ]}
        />
        <SentryRoute
          component={PlaceholderSidePane}
          exact
          path={`${path}${APP_LIBRARIES_EDITOR_PATH}`}
        />
        <SentryRoute
          component={AppSettingsPane}
          exact
          path={`${path}${APP_SETTINGS_EDITOR_PATH}`}
        />
        <SentryRoute component={WidgetsEditorEntityExplorer} />
      </Switch>
    </SidePaneContainer>
  );
};

export default IDESidePane;
