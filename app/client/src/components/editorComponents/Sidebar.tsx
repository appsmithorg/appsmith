import React, { memo } from "react";
import { Switch, Route } from "react-router";
import styled from "styled-components";
import { WIDGETS_URL } from "constants/routes";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import ExplorerSidebar from "pages/Editor/Explorer";

const SidebarWrapper = styled.div`
  padding: 0px 0 0 6px;
  color: ${props => props.theme.colors.textOnDarkBG};
  overflow-y: auto;
`;

export const Sidebar = memo(() => {
  return (
    <SidebarWrapper className="t--sidebar">
      <Switch>
        <Route
          exact
          path={WIDGETS_URL()}
          component={WidgetSidebar}
          name={"WidgetSidebar"}
        />
        <Route component={ExplorerSidebar} name={"ExplorerSidebar"} />
      </Switch>
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
