import React, { useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { useLocation, useRouteMatch } from "react-router";
import ApiEditor from "pages/Editor/APIEditor";
import IntegrationEditor from "pages/Editor/IntegrationEditor";
import QueryEditor from "pages/Editor/QueryEditor";
import JSEditor from "pages/Editor/JSEditor";
import GeneratePage from "pages/Editor/GeneratePage";
import ProviderTemplates from "pages/Editor/APIEditor/ProviderTemplates";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CHECKLIST_PATH,
  CURL_IMPORT_PAGE_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { SaaSEditorRoutes } from "pages/Editor/SaaSEditor/routes";
import OnboardingChecklist from "pages/Editor/FirstTimeUserOnboarding/Checklist";
import { DatasourceEditorRoutes } from "pages/routes";
import CurlImportEditor from "pages/Editor/APIEditor/CurlImportEditor";
import CreateNewDatasourceTab from "../../../pages/Editor/IntegrationEditor/CreateNewDatasourceTab";
import { useIsAppSidebarEnabled } from "../../../navigation/featureFlagHooks";

const SentryRoute = Sentry.withSentryRouting(Route);

function EditorRoutes() {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const isAppSidebarEnabled = useIsAppSidebarEnabled();

  useEffect(() => {
    return () => {
      PerformanceTracker.startTracking(
        PerformanceTransactionName.CLOSE_SIDE_PANE,
        { path: pathname },
      );
    };
  });

  return (
    <Switch key={path}>
      <SentryRoute
        component={
          isAppSidebarEnabled ? CreateNewDatasourceTab : IntegrationEditor
        }
        exact
        path={`${path}${INTEGRATION_EDITOR_PATH}`}
      />
      <SentryRoute
        component={OnboardingChecklist}
        exact
        path={`${path}${BUILDER_CHECKLIST_PATH}`}
      />
      <SentryRoute
        component={ApiEditor}
        exact
        path={`${path}${API_EDITOR_ID_PATH}`}
      />
      <SentryRoute
        component={QueryEditor}
        exact
        path={`${path}${QUERIES_EDITOR_ID_PATH}`}
      />
      <SentryRoute
        component={JSEditor}
        exact
        path={`${path}${JS_COLLECTION_ID_PATH}`}
      />

      <SentryRoute
        component={CurlImportEditor}
        exact
        path={`${path}${CURL_IMPORT_PAGE_PATH}`}
      />
      {SaaSEditorRoutes.map(({ component, path: childPath }) => (
        <SentryRoute
          component={component}
          exact
          key={path}
          path={`${path}${childPath}`}
        />
      ))}
      {DatasourceEditorRoutes.map(({ component, path: childPath }) => (
        <SentryRoute
          component={component}
          exact
          key={childPath}
          path={`${path}${childPath}`}
        />
      ))}
      <SentryRoute
        component={ProviderTemplates}
        exact
        path={`${path}${PROVIDER_TEMPLATE_PATH}`}
      />
      <SentryRoute
        component={GeneratePage}
        exact
        path={`${path}${GENERATE_TEMPLATE_FORM_PATH}`}
      />
    </Switch>
  );
}

export default EditorRoutes;
