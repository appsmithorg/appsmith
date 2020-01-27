import React from "react";
import { Switch, Route } from "react-router";
import styled from "styled-components";
import {
  API_EDITOR_URL,
  BUILDER_URL,
  API_EDITOR_ID_URL,
  PAGE_LIST_EDITOR_URL,
} from "constants/routes";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import ApiSidebar from "pages/Editor/ApiSidebar";
import PageListSidebar from "pages/Editor/PageListSidebar";

const SidebarWrapper = styled.div`
  background-color: ${props => props.theme.colors.paneBG};
  padding: 5px 0;
  color: ${props => props.theme.colors.textOnDarkBG};
  overflow-y: auto;
`;

export const Sidebar = () => {
  return (
    <SidebarWrapper>
      <Switch>
        <Route exact path={BUILDER_URL} component={WidgetSidebar} />
        <Route exact path={API_EDITOR_URL()} component={ApiSidebar} />
        <Route exact path={API_EDITOR_ID_URL()} component={ApiSidebar} />
        <Route
          exact
          path={PAGE_LIST_EDITOR_URL()}
          component={PageListSidebar}
        />
      </Switch>
    </SidebarWrapper>
  );
};

export default Sidebar;
