import React, { useMemo } from "react";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";
import {
  APP_LIBRARIES_EDITOR_PATH,
  APP_PACKAGES_EDITOR_PATH,
  APP_SETTINGS_EDITOR_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import AppSettingsPane from "./AppSettings";
import DataSidePane from "./DataSidePane";
import EditorPane from "../EditorPane";
import LibrarySidePane from "ee/pages/Editor/IDE/LeftPane/LibrarySidePane";

export const LeftPaneContainer = styled.div<{ showRightBorder?: boolean }>`
  height: 100%;
  border-right: ${({ showRightBorder = true }) =>
    showRightBorder ? "1px solid var(--ads-v2-color-border)" : "none"};
  background: var(--ads-v2-color-bg);
  overflow: hidden;
`;

const LeftPane = () => {
  const { path } = useRouteMatch();

  const dataSidePanePaths = useMemo(
    () => [
      `${path}${DATA_SOURCES_EDITOR_LIST_PATH}`,
      `${path}${DATA_SOURCES_EDITOR_ID_PATH}`,
      `${path}${INTEGRATION_EDITOR_PATH}`,
      `${path}${SAAS_GSHEET_EDITOR_ID_PATH}`,
    ],
    [path],
  );

  const librarySidePanePaths = useMemo(
    () => [
      `${path}${APP_LIBRARIES_EDITOR_PATH}`,
      `${path}${APP_PACKAGES_EDITOR_PATH}`,
    ],
    [path],
  );

  return (
    <LeftPaneContainer showRightBorder={false}>
      <Switch>
        <SentryRoute component={DataSidePane} exact path={dataSidePanePaths} />
        <SentryRoute
          component={LibrarySidePane}
          exact
          path={librarySidePanePaths}
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
