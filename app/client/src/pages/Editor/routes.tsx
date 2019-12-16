import React from "react";
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import ApiEditor from "./APIEditor";
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  BUILDER_PAGE_URL,
  BUILDER_BASE_URL,
  BuilderRouteParams,
  APIEditorRouteParams,
} from "constants/routes";
import styled from "styled-components";

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - ${props => props.theme.headerHeight});
  background-color: ${props =>
    props.isVisible ? "rgba(0, 0, 0, 0.26)" : "transparent"};
  z-index: ${props => (props.isVisible ? 10 : -1)};
  transition-property: z-index;
  transition-delay: ${props => (props.isVisible ? "0" : "0.25s")};
`;

const DrawerWrapper = styled.div<{ isVisible: boolean }>`
  background-color: white;
  width: 75%;
  height: 100%;
  box-shadow: -1px 2px 3px 0px ${props => props.theme.colors.paneBG};
  transform: translateX(${props => (props.isVisible ? `0` : `-80vw`)});
  transition: 0.25s;
`;

interface RouterState {
  isVisible: boolean;
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
      <Wrapper isVisible={this.state.isVisible} onClick={this.handleClose}>
        <DrawerWrapper
          isVisible={this.state.isVisible}
          onClick={this.preventClose}
        >
          <Switch>
            <Route exact path={API_EDITOR_URL()} component={ApiEditor} />
            <Route exact path={API_EDITOR_ID_URL()} component={ApiEditor} />
          </Switch>
        </DrawerWrapper>
      </Wrapper>
    );
  }
}

export default withRouter(EditorsRouter);
