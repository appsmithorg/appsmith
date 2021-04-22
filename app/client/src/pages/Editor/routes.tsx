import React, { useEffect, ReactNode } from "react";
import {
  Switch,
  withRouter,
  RouteComponentProps,
  Route,
  matchPath,
} from "react-router-dom";
import ApiEditor from "./APIEditor";
import QueryEditor from "./QueryEditor";
import DataSourceEditor from "./DataSourceEditor";

import CurlImportForm from "./APIEditor/CurlImportForm";
import ProviderTemplates from "./APIEditor/ProviderTemplates";
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  QUERIES_EDITOR_URL,
  QUERIES_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  BUILDER_PAGE_URL,
  BuilderRouteParams,
  APIEditorRouteParams,
  getCurlImportPageURL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  getProviderTemplatesURL,
} from "constants/routes";
import styled from "styled-components";
import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";
import { closeAllModals } from "actions/widgetActions";
import { useDispatch } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

import { SaaSEditorRoutes } from "./SaaSEditor/routes";

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => (!props.isVisible ? "0px" : "100%")};
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  background-color: ${(props) =>
    props.isVisible ? "rgba(0, 0, 0, 0.26)" : "transparent"};
  z-index: ${(props) => (props.isVisible ? 2 : -1)};
`;

const DrawerWrapper = styled.div<{
  isVisible: boolean;
  isAPIPath: any;
}>`
  background-color: white;
  width: ${(props) =>
    !props.isVisible ? "0px" : props.isAPIPath ? "100%" : "75%"};
  height: 100%;
`;

interface RouterState {
  isVisible: boolean;
  isAPIPath: Record<any, any> | null;
}

class EditorsRouter extends React.Component<
  RouteComponentProps<BuilderRouteParams>,
  RouterState
> {
  constructor(props: RouteComponentProps<APIEditorRouteParams>) {
    super(props);
    const { applicationId, pageId } = this.props.match.params;
    this.state = {
      isVisible:
        this.props.location.pathname !==
        BUILDER_PAGE_URL(applicationId, pageId),
      isAPIPath: this.isMatchPath(),
    };
  }

  componentDidUpdate(prevProps: Readonly<RouteComponentProps>): void {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      const { applicationId, pageId } = this.props.match.params;
      this.setState({
        isVisible:
          this.props.location.pathname !==
          BUILDER_PAGE_URL(applicationId, pageId),
        isAPIPath: this.isMatchPath(),
      });
    }
  }

  isMatchPath = () => {
    return matchPath(this.props.location.pathname, {
      path: [
        API_EDITOR_URL(),
        API_EDITOR_ID_URL(),
        API_EDITOR_URL_WITH_SELECTED_PAGE_ID(),
      ],
      exact: true,
      strict: false,
    });
  };

  handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: this.props.location.pathname },
    );
    e.stopPropagation();
    const { applicationId, pageId } = this.props.match.params;
    this.setState({
      isVisible: false,
    });
    this.props.history.replace(BUILDER_PAGE_URL(applicationId, pageId));
  };

  preventClose = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  render(): React.ReactNode {
    return (
      <Wrapper isVisible={this.state.isVisible} onClick={this.handleClose}>
        <PaneDrawer
          isVisible={this.state.isVisible}
          isAPIPath={this.state.isAPIPath}
          onClick={this.preventClose}
        >
          <Switch>
            <SentryRoute exact path={API_EDITOR_URL()} component={ApiEditor} />
            <SentryRoute
              exact
              path={API_EDITOR_ID_URL()}
              component={ApiEditor}
            />
            <SentryRoute
              exact
              path={API_EDITOR_URL_WITH_SELECTED_PAGE_ID()}
              component={ApiEditor}
            />
            <SentryRoute
              exact
              path={QUERIES_EDITOR_URL()}
              component={QueryEditor}
            />
            <SentryRoute
              exact
              path={QUERIES_EDITOR_ID_URL()}
              component={QueryEditor}
            />

            <SentryRoute
              exact
              path={getCurlImportPageURL()}
              component={CurlImportForm}
            />
            {SaaSEditorRoutes.map((props) => (
              <SentryRoute exact key={props.path} {...props} />
            ))}
            <SentryRoute
              exact
              path={DATA_SOURCES_EDITOR_URL()}
              component={DataSourceEditor}
            />
            <SentryRoute
              exact
              path={DATA_SOURCES_EDITOR_ID_URL()}
              component={DataSourceEditor}
            />
            <SentryRoute
              exact
              path={getProviderTemplatesURL()}
              component={ProviderTemplates}
            />
          </Switch>
        </PaneDrawer>
      </Wrapper>
    );
  }
}
type PaneDrawerProps = {
  isVisible: boolean;
  isAPIPath: Record<any, any> | null;
  onClick: (e: React.MouseEvent) => void;
  children: ReactNode;
};
const PaneDrawer = (props: PaneDrawerProps) => {
  const showPropertyPane = useShowPropertyPane();
  const { selectWidget, focusWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  useEffect(() => {
    // This pane drawer is only open when NOT on canvas.
    // De-select all widgets
    // Un-focus all widgets
    // Hide property pane
    // Close all modals
    if (props.isVisible) {
      showPropertyPane();
      selectWidget(undefined);
      focusWidget(undefined);
      dispatch(closeAllModals());
    }
  }, [dispatch, props.isVisible, selectWidget, showPropertyPane, focusWidget]);
  return <DrawerWrapper {...props}>{props.children}</DrawerWrapper>;
};

PaneDrawer.displayName = "PaneDrawer";

export default withRouter(EditorsRouter);
