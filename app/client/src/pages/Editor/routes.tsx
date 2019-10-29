import React from "react";
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import ApiEditor from "./ApiEditor";
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  BUILDER_URL,
} from "../../constants/routes";
import styled from "styled-components";

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 1px;
  left: 1px;
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
  width: 80%;
  height: 100%;
  box-shadow: -1px 2px 3px 0px ${props => props.theme.colors.paneBG};
  transform: translateX(${props => (props.isVisible ? `0` : `-80vw`)});
  transition: 0.25s;
`;

interface RouterState {
  isVisible: boolean;
}

class EditorsRouter extends React.Component<RouteComponentProps, RouterState> {
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = {
      isVisible: this.props.location.pathname !== BUILDER_URL,
    };
  }
  componentDidUpdate(prevProps: Readonly<RouteComponentProps>): void {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.setState({
        isVisible: this.props.location.pathname !== BUILDER_URL,
      });
    }
  }

  handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState({
      isVisible: false,
    });
    this.props.history.replace(BUILDER_URL);
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
            <Route exact path={API_EDITOR_URL} component={ApiEditor} />
            <Route path={API_EDITOR_ID_URL()} component={ApiEditor} />
          </Switch>
        </DrawerWrapper>
      </Wrapper>
    );
  }
}

export default withRouter(EditorsRouter);
