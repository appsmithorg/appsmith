import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import DataSidePane from "pages/Editor/IDE/LeftPane/DataSidePane";
import PackageMainContainer from "../../PackageMainContainer";
import { LeftPaneContainer } from "pages/Editor/IDE/LeftPane";
import PackageSettings from "./PackageSettings";
import { PACKAGE_SETTINGS_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";

const LeftPane = () => {
  const { path } = useRouteMatch();
  return (
    <LeftPaneContainer>
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
          component={PackageSettings}
          exact
          path={`${path}${PACKAGE_SETTINGS_EDITOR_PATH}`}
        />
        <SentryRoute component={PackageMainContainer} />
      </Switch>
    </LeftPaneContainer>
  );
};

export default LeftPane;
