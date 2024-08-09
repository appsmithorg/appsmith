import React from "react";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";
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
import LibrarySidePane from "./LibrarySidePane";
import EditorPane from "../EditorPane";

export const LeftPaneContainer = styled.div<{ showRightBorder?: boolean }>`
  height: 100%;
  border-right: ${({ showRightBorder = true }) =>
    showRightBorder ? "1px solid var(--ads-v2-color-border)" : "none"};
  background: var(--ads-v2-color-bg);
  overflow: hidden;
`;

const LeftPane = () => {
  const { path } = useRouteMatch();
  return (
    <LeftPaneContainer showRightBorder={false}>
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
          component={LibrarySidePane}
          exact
          path={`${path}${APP_LIBRARIES_EDITOR_PATH}`}
        />
        <SentryRoute
          component={AppSettingsPane}
          exact
          path={`${path}${APP_SETTINGS_EDITOR_PATH}`}
        />
        <SentryRoute component={EditorPane} />
      </Switch>
    </LeftPaneContainer>
  );
};

export default LeftPane;
