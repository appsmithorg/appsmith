import React from "react";
import { Route, Switch } from "react-router";
import * as Sentry from "@sentry/react";
import {
  MODULE_EDITOR_PATH,
  PACKAGE_EDITOR_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import ModuleEditor from "@appsmith/pages/Editor/ModuleEditor";
import IntegrationEditor from "pages/Editor/IntegrationEditor";
import {
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
} from "constants/routes";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";

const SentryRoute = Sentry.withSentryRouting(Route);
export const MainPane = (props: { id: string }) => {
  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2"
      id={props.id}
    >
      <Switch>
        {/* All subroutes go here */}
        <SentryRoute component={ModuleEditor} path={MODULE_EDITOR_PATH} />
        <SentryRoute
          component={IntegrationEditor}
          exact
          path={`${PACKAGE_EDITOR_PATH}${INTEGRATION_EDITOR_PATH}`}
        />
        <SentryRoute
          component={DataSourceEditor}
          exact
          path={`${PACKAGE_EDITOR_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`}
        />
        <SentryRoute
          component={DatasourceForm}
          exact
          path={`${PACKAGE_EDITOR_PATH}${SAAS_EDITOR_DATASOURCE_ID_PATH}`}
        />
      </Switch>
    </div>
  );
};

export default MainPane;
