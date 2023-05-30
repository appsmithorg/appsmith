import React, { useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { useLocation, useRouteMatch } from "react-router";
import ApiEditor from "./APIEditor";
import IntegrationEditor from "./IntegrationEditor";
import QueryEditor from "./QueryEditor";
import JSEditor from "./JSEditor";
import GeneratePage from "./GeneratePage";
import CurlImportForm from "./APIEditor/CurlImportForm";
import ProviderTemplates from "./APIEditor/ProviderTemplates";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CHECKLIST_PATH,
  BUILDER_CUSTOM_PATH,
  CURL_IMPORT_PAGE_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import styled from "styled-components";
import { useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { SaaSEditorRoutes } from "./SaaSEditor/routes";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
import { DatasourceEditorRoutes } from "@appsmith/pages/routes";
import PropertyPaneContainer from "pages/Editor/WidgetsEditor/PropertyPaneContainer";
import { getPaneCount, isMultiPaneActive } from "selectors/multiPaneSelectors";
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";

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
  const isMultiPane = useSelector(isMultiPaneActive);
  const paneCount = useSelector(getPaneCount);

  useEffect(() => {
    return () => {
      PerformanceTracker.startTracking(
        PerformanceTransactionName.CLOSE_SIDE_PANE,
        { path: pathname },
      );
    };
  });

  const showPropertyPane = isMultiPane
    ? paneCount === PaneLayoutOptions.TWO_PANE
    : false;

  return (
    <Switch key={path}>
      {showPropertyPane && (
        <SentryRoute
          exact
          path={BUILDER_CUSTOM_PATH}
          render={() => {
            return (
              <Wrapper isVisible>
                <PropertyPaneContainer />
              </Wrapper>
            );
          }}
        />
      )}
      <SentryRoute
        exact
        path={`${path}${INTEGRATION_EDITOR_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <IntegrationEditor {...routeProps} />
            </Wrapper>
          );
        }}
      />
      <SentryRoute
        exact
        path={`${path}${BUILDER_CHECKLIST_PATH}`}
        render={() => {
          return (
            <Wrapper isVisible>
              <OnboardingChecklist />
            </Wrapper>
          );
        }}
      />
      <SentryRoute
        exact
        path={`${path}${API_EDITOR_ID_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <ApiEditor {...routeProps} />
            </Wrapper>
          );
        }}
      />
      <SentryRoute
        exact
        path={`${path}${QUERIES_EDITOR_ID_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <QueryEditor {...routeProps} />
            </Wrapper>
          );
        }}
      />
      <SentryRoute
        exact
        path={`${path}${JS_COLLECTION_EDITOR_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <JSEditor {...(routeProps as any)} />
            </Wrapper>
          );
        }}
      />
      <SentryRoute
        exact
        path={`${path}${JS_COLLECTION_ID_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <JSEditor {...(routeProps as any)} />
            </Wrapper>
          );
        }}
      />

      <SentryRoute
        exact
        path={`${path}${CURL_IMPORT_PAGE_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <CurlImportForm {...(routeProps as any)} />
            </Wrapper>
          );
        }}
      />
      {SaaSEditorRoutes.map(({ component: Component, path: childPath }) => (
        <SentryRoute
          exact
          key={path}
          path={`${path}${childPath}`}
          render={(routeProps) => {
            return (
              <Wrapper isVisible>
                <Component {...(routeProps as any)} />
              </Wrapper>
            );
          }}
        />
      ))}
      {DatasourceEditorRoutes.map(
        ({ component: Component, path: childPath }) => (
          <SentryRoute
            exact
            key={childPath}
            path={`${path}${childPath}`}
            render={(routeProps) => {
              return (
                <Wrapper isVisible>
                  <Component {...routeProps} />
                </Wrapper>
              );
            }}
          />
        ),
      )}
      <SentryRoute
        exact
        path={`${path}${PROVIDER_TEMPLATE_PATH}`}
        render={(routeProps) => {
          return (
            <Wrapper isVisible>
              <ProviderTemplates {...routeProps} />
            </Wrapper>
          );
        }}
      />
      <SentryRoute
        exact
        path={`${path}${GENERATE_TEMPLATE_FORM_PATH}`}
        render={() => {
          return (
            <Wrapper isVisible>
              <GeneratePage />
            </Wrapper>
          );
        }}
      />
    </Switch>
  );
}

export default EditorsRouter;
