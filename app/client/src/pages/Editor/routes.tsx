import React, { useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { useLocation, useRouteMatch } from "react-router";
import ApiEditor from "./APIEditor";
import IntegrationEditor from "./IntegrationEditor";
import QueryEditor from "./QueryEditor";
import JSEditor from "./JSEditor";
import GeneratePage from "./GeneratePage";
import ProviderTemplates from "./APIEditor/ProviderTemplates";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CHECKLIST_PATH,
  CURL_IMPORT_PAGE_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import styled from "styled-components";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { SaaSEditorRoutes } from "./SaaSEditor/routes";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
import { DatasourceEditorRoutes } from "pages/routes";
import CurlImportEditor from "./APIEditor/CurlImportEditor";

const SentryRoute = Sentry.withSentryRouting(Route);

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => (!props.isVisible ? "0px" : "100%")};
  height: 100%;
  background-color: ${(props) => (props.isVisible ? "white" : "transparent")};
  z-index: ${(props) => (props.isVisible ? 2 : -1)};
  width: ${(props) => (!props.isVisible ? "0" : "100%")};
  display: flex;
  flex-direction: column;
`;

function EditorsRouter() {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();

  useEffect(() => {
    return () => {
      PerformanceTracker.startTracking(
        PerformanceTransactionName.CLOSE_SIDE_PANE,
        { path: pathname },
      );
    };
  });

  return (
    <Wrapper isVisible>
      <Switch key={path}>
        <SentryRoute
          component={IntegrationEditor}
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
          path={`${path}${JS_COLLECTION_EDITOR_PATH}`}
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
    </Wrapper>
  );
}

export default EditorsRouter;
