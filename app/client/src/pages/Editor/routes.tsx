import React, { ReactNode, useCallback, useEffect } from "react";
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
  matchBuilderPath,
  PROVIDER_TEMPLATE_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import styled from "styled-components";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { closeAllModals } from "actions/widgetActions";
import { useDispatch, useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { SaaSEditorRoutes } from "./SaaSEditor/routes";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { builderURL } from "RouteBuilder";
import history from "utils/history";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
import { getCurrentPageId } from "selectors/editorSelectors";
import { DatasourceEditorRoutes } from "@appsmith/pages/routes";
import PropertyPaneContainer from "pages/Editor/WidgetsEditor/PropertyPaneContainer";
import { getPaneCount, isMultiPaneActive } from "selectors/multiPaneSelectors";
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

const SentryRoute = Sentry.withSentryRouting(Route);

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
  const isMultiPane = useSelector(isMultiPaneActive);
  const paneCount = useSelector(getPaneCount);

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

  const showPropertyPane = isMultiPane
    ? paneCount === PaneLayoutOptions.TWO_PANE
    : false;

  return (
    <Wrapper isVisible={isVisible} onClick={handleClose}>
      <PaneDrawer isVisible={isVisible} onClick={preventClose}>
        <Switch key={path}>
          {showPropertyPane && (
            <SentryRoute
              component={PropertyPaneContainer}
              exact
              path={BUILDER_CUSTOM_PATH}
            />
          )}
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
  const isMultiPane = useSelector(isMultiPaneActive);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!isMultiPane) {
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
          selectWidget(SelectionRequestType.Empty);
          focusWidget(undefined);
        }, 0);
      }
    }
  }, [
    dispatch,
    props.isVisible,
    selectWidget,
    showPropertyPane,
    focusWidget,
    isMultiPane,
  ]);
  return <DrawerWrapper {...props}>{props.children}</DrawerWrapper>;
}

PaneDrawer.displayName = "PaneDrawer";

export default EditorsRouter;
