import React from "react";
import { Switch, Route } from "react-router";
import styled from "styled-components";
import {
  API_EDITOR_URL,
  BUILDER_URL,
  API_EDITOR_ID_URL,
} from "../../constants/routes";
import WidgetSidebar from "../../pages/Editor/WidgetSidebar";
import ApiSidebar from "../../pages/Editor/ApiSidebar";

const SidebarWrapper = styled.div`
  flex: 7;
  background-color: ${props => props.theme.colors.paneBG};
  padding: 5px 10px;
  color: ${props => props.theme.colors.textOnDarkBG};
`;

class Sidebar extends React.Component {
  render() {
    return (
      <React.Fragment>
        <SidebarWrapper>
          <Switch>
            <Route exact path={BUILDER_URL} component={WidgetSidebar} />
            <Route exact path={API_EDITOR_URL} component={ApiSidebar} />
            <Route exact path={API_EDITOR_ID_URL()} component={ApiSidebar} />
          </Switch>
        </SidebarWrapper>
      </React.Fragment>
    );
  }
}

export default Sidebar;
