import React, { useMemo } from "react";
import { useSelector } from "react-redux";
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
import AppSettingsPane from "../../components/AppSettings";
import { DataSidePane } from "pages/Editor/DataSidePane";
import EditorPane from "./EditorPane";
import LibrarySidePane from "ee/pages/AppIDE/components/LibrariesList/LibrarySidePane";
import { getDatasourceUsageCountForApp } from "ee/selectors/entitiesSelector";
import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";
import { Flex } from "@appsmith/ads";

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

  const dsUsageMap = useSelector((state) =>
    getDatasourceUsageCountForApp(state, IDE_TYPE.App),
  );

  return (
    <Flex
      backgroundColor="var(--ads-v2-color-bg)"
      borderRight="1px solid var(--ads-v2-color-border)"
      height="100%"
      overflow="hidden"
    >
      <Switch>
        <SentryRoute
          exact
          path={dataSidePanePaths}
          render={(routeProps) => (
            <DataSidePane {...routeProps} dsUsageMap={dsUsageMap} />
          )}
        />
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
    </Flex>
  );
};

export default LeftPane;
