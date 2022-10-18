import React, { useEffect, ReactNode, useCallback } from "react";
import { Switch, Route } from "react-router-dom";
import { useLocation, useRouteMatch } from "react-router";
import ApiEditor from "./APIEditor";
import IntegrationEditor from "./IntegrationEditor";
import QueryEditor from "./QueryEditor";
import DataSourceEditor from "./DataSourceEditor";
import JSEditor from "./JSEditor";
import GeneratePage from "./GeneratePage";
import CurlImportForm from "./APIEditor/CurlImportForm";
import ProviderTemplates from "./APIEditor/ProviderTemplates";
import {
  INTEGRATION_EDITOR_PATH,
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  CURL_IMPORT_PAGE_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  matchBuilderPath,
  BUILDER_CHECKLIST_PATH,
} from "constants/routes";
import styled from "styled-components";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { closeAllModals } from "actions/widgetActions";
import { useDispatch, useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);
import { SaaSEditorRoutes } from "./SaaSEditor/routes";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { builderURL } from "RouteBuilder";
import history from "utils/history";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
import { getCurrentPageId } from "selectors/editorSelectors";

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => (!props.isVisible ? "0px" : "100%")};
  height: 100%;
  background-color: ${(props) =>
    props.isVisible ? "rgba(0, 0, 0, 0.26)" : "transparent"};
  z-index: ${(props) => (props.isVisible ? 2 : -1)};
`;

const DrawerWrapper = styled.div<{
  isVisible: boolean;
}>`
  background-color: white;
  width: ${(props) => (!props.isVisible ? "0" : "100%")};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

function EditorsRouter() {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = React.useState(
    () => !matchBuilderPath(pathname),
  );
  const pageId = useSelector(getCurrentPageId);

  useEffect(() => {
    const isOnBuilder = matchBuilderPath(pathname);
    setIsVisible(!isOnBuilder);
  }, [pathname]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      PerformanceTracker.startTracking(
        PerformanceTransactionName.CLOSE_SIDE_PANE,
        { path: pathname },
      );
      e.stopPropagation();
      setIsVisible(false);
      history.replace(builderURL({ pageId }));
    },
    [pathname, pageId],
  );

  const preventClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Wrapper isVisible={isVisible} onClick={handleClose}>
      <PaneDrawer isVisible={isVisible} onClick={preventClose}>
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
            component={CurlImportForm}
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
          <SentryRoute
            component={DataSourceEditor}
            exact
            path={`${path}${DATA_SOURCES_EDITOR_ID_PATH}`}
          />
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
      </PaneDrawer>
    </Wrapper>
  );
}

type PaneDrawerProps = {
  isVisible: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: ReactNode;
};
function PaneDrawer(props: PaneDrawerProps) {
  const showPropertyPane = useShowPropertyPane();
  const { focusWidget, selectWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  useEffect(() => {
    // This pane drawer is only open when NOT on canvas.
    // De-select all widgets
    // Un-focus all widgets
    // Hide property pane
    // Close all modals
    if (props.isVisible) {
      showPropertyPane();
      dispatch(closeAllModals());
      // delaying setting select and focus state,
      // so that the focus history has time to store the selected values
      setTimeout(() => {
        selectWidget(undefined);
        focusWidget(undefined);
      }, 0);
    }
  }, [dispatch, props.isVisible, selectWidget, showPropertyPane, focusWidget]);
  return <DrawerWrapper {...props}>{props.children}</DrawerWrapper>;
}

PaneDrawer.displayName = "PaneDrawer";

export default EditorsRouter;
