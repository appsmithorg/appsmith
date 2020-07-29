import React, { useEffect, ReactNode } from "react";
import { Switch, withRouter, RouteComponentProps } from "react-router-dom";
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
  BUILDER_BASE_URL,
  BUILDER_PAGE_URL,
  BuilderRouteParams,
  APIEditorRouteParams,
  getCurlImportPageURL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  getProviderTemplatesURL,
} from "constants/routes";
import styled from "styled-components";
import AppRoute from "pages/common/AppRoute";
import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";

const Wrapper = styled.div<{ isVisible: boolean; showOnlySidebar?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${props => (props.showOnlySidebar ? "0px" : "100%")};
  height: calc(100vh - ${props => props.theme.headerHeight});
  background-color: ${props =>
    props.isVisible ? "rgba(0, 0, 0, 0.26)" : "transparent"};
  z-index: ${props => (props.isVisible ? 2 : -1)};
`;

const DrawerWrapper = styled.div<{
  isVisible: boolean;
  showOnlySidebar?: boolean;
}>`
  background-color: white;
  width: ${props => (props.showOnlySidebar ? "0px" : "75%")};
  height: 100%;
`;

interface RouterState {
  isVisible: boolean;
  showOnlySidebar: boolean;
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
        this.props.location.pathname !== BUILDER_BASE_URL(applicationId) &&
        this.props.location.pathname !==
          BUILDER_PAGE_URL(applicationId, pageId),
      showOnlySidebar:
        // TODO: Please optimise this
        !(
          this.props.location.pathname.indexOf(
            DATA_SOURCES_EDITOR_URL(applicationId, pageId),
          ) !== -1 ||
          this.props.location.pathname.indexOf(
            API_EDITOR_URL(applicationId, pageId),
          ) !== -1 ||
          this.props.location.pathname.indexOf(
            QUERIES_EDITOR_URL(applicationId, pageId),
          ) !== -1
        ),
    };
  }

  componentDidUpdate(prevProps: Readonly<RouteComponentProps>): void {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      const { applicationId, pageId } = this.props.match.params;
      this.setState({
        isVisible:
          this.props.location.pathname !== BUILDER_BASE_URL(applicationId) &&
          this.props.location.pathname !==
            BUILDER_PAGE_URL(applicationId, pageId),
        showOnlySidebar:
          // TODO: Please optimise this
          !(
            this.props.location.pathname.indexOf(
              DATA_SOURCES_EDITOR_URL(applicationId, pageId),
            ) !== -1 ||
            this.props.location.pathname.indexOf(
              API_EDITOR_URL(applicationId, pageId),
            ) !== -1 ||
            this.props.location.pathname.indexOf(
              QUERIES_EDITOR_URL(applicationId, pageId),
            ) !== -1
          ),
      });
    }
  }

  handleClose = (e: React.MouseEvent) => {
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
      <Wrapper
        isVisible={this.state.isVisible}
        onClick={
          !this.state.showOnlySidebar ? this.handleClose : this.preventClose
        }
        showOnlySidebar={this.state.showOnlySidebar}
      >
        <PaneDrawer
          isVisible={this.state.isVisible}
          showOnlySidebar={this.state.showOnlySidebar}
          onClick={this.preventClose}
        >
          <Switch>
            <AppRoute
              exact
              path={API_EDITOR_URL()}
              component={ApiEditor}
              name={"ApiEditor"}
            />
            <AppRoute
              exact
              path={API_EDITOR_ID_URL()}
              component={ApiEditor}
              name={"ApiEditor"}
            />
            <AppRoute
              exact
              path={API_EDITOR_URL_WITH_SELECTED_PAGE_ID()}
              component={ApiEditor}
              name={"ApiEditor"}
            />
            <AppRoute
              exact
              path={QUERIES_EDITOR_URL()}
              component={QueryEditor}
              name={"QueryEditor"}
            />
            <AppRoute
              exact
              path={QUERIES_EDITOR_ID_URL()}
              component={QueryEditor}
              name={"QueryEditor"}
            />

            <AppRoute
              exact
              path={getCurlImportPageURL()}
              component={CurlImportForm}
              name={"ApiEditor"}
            />
            <AppRoute
              exact
              path={DATA_SOURCES_EDITOR_URL()}
              component={DataSourceEditor}
              name={"DataSourceEditor"}
            />
            <AppRoute
              exact
              path={DATA_SOURCES_EDITOR_ID_URL()}
              component={DataSourceEditor}
              name={"DataSourceEditor"}
            />
            <AppRoute
              exact
              path={getProviderTemplatesURL()}
              component={ProviderTemplates}
              name={"ApiEditor"}
            />
          </Switch>
        </PaneDrawer>
      </Wrapper>
    );
  }
}
type PaneDrawerProps = {
  isVisible: boolean;
  showOnlySidebar: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: ReactNode;
};
const PaneDrawer = (props: PaneDrawerProps) => {
  const showPropertyPane = useShowPropertyPane();
  const { selectWidget, focusWidget } = useWidgetSelection();

  useEffect(() => {
    // This pane drawer is only open when NOT on canvas.
    // De-select all widgets
    // Un-focus all widgets
    // Hide property pane
    if (props.isVisible) {
      showPropertyPane();
      selectWidget(undefined);
      focusWidget(undefined);
    }
  }, [props.isVisible, selectWidget, showPropertyPane, focusWidget]);
  return <DrawerWrapper {...props}>{props.children}</DrawerWrapper>;
};

export default withRouter(EditorsRouter);
