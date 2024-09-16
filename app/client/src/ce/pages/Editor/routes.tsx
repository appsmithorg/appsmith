import React from "react";
import { Route, Switch } from "react-router-dom";
import { useRouteMatch } from "react-router";
import ApiEditor from "pages/Editor/APIEditor";
import QueryEditor from "pages/Editor/QueryEditor";
import JSEditor from "pages/Editor/JSEditor";
import GeneratePage from "pages/Editor/GeneratePage";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CHECKLIST_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import * as Sentry from "@sentry/react";
import { SaaSEditorRoutes } from "pages/Editor/SaaSEditor/routes";
import OnboardingChecklist from "pages/Editor/FirstTimeUserOnboarding/Checklist";
import { DatasourceEditorRoutes } from "pages/routes";
import CreateNewDatasourceTab from "pages/Editor/IntegrationEditor/CreateNewDatasourceTab";

const SentryRoute = Sentry.withSentryRouting(Route);

function EditorRoutes() {
  const { path } = useRouteMatch();

  return (
    <Switch key={path}>
      <SentryRoute
        component={CreateNewDatasourceTab}
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
        component={GeneratePage}
        exact
        path={`${path}${GENERATE_TEMPLATE_FORM_PATH}`}
      />
    </Switch>
  );
}

export default EditorRoutes;
