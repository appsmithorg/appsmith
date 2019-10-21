import React from "react";
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import ApiEditor from "./ApiEditor";
import { API_EDITOR_URL, BUILDER_URL } from "../../constants/routes";
import { Drawer, Position } from "@blueprintjs/core";
import styled from "styled-components";

const MainWrapper = styled.div`
  position: absolute;
  width: calc(100vw - ${props => props.theme.sidebarWidth});
  height: calc(100vh - ${props => props.theme.headerHeight});
  left: ${props => props.theme.sidebarWidth};
`;

interface RouterState {
  drawerOpen: boolean;
}

class EditorsRouter extends React.Component<RouteComponentProps, RouterState> {
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = {
      drawerOpen: this.props.location.pathname !== BUILDER_URL,
    };
  }
  componentDidUpdate(prevProps: Readonly<RouteComponentProps>): void {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.setState({
        drawerOpen: this.props.location.pathname !== BUILDER_URL,
      });
    }
  }

  render(): React.ReactNode {
    const drawerOpen = this.props.location.pathname !== BUILDER_URL;
    return (
      <MainWrapper>
        <Drawer
          isOpen={drawerOpen}
          position={Position.LEFT}
          usePortal={false}
          size="75%"
        >
          <Switch>
            <Route exact path={API_EDITOR_URL} component={ApiEditor} />
          </Switch>
        </Drawer>
      </MainWrapper>
    );
  }
}

export default withRouter(EditorsRouter);
