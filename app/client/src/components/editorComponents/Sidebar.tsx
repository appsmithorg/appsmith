import React, { memo } from "react";
import { Switch } from "react-router";
import styled from "styled-components";
import {
  API_EDITOR_URL,
  BUILDER_URL,
  WIDGETS_URL,
  API_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  QUERIES_EDITOR_URL,
  QUERIES_EDITOR_ID_URL,
  getCurlImportPageURL,
  getProviderTemplatesURL,
} from "constants/routes";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import ExplorerSidebar from "pages/Editor/Explorer";
import AppRoute from "pages/common/AppRoute";

const SidebarWrapper = styled.div`
  padding: 0px 0 0 6px;
  color: ${props => props.theme.colors.textOnDarkBG};
  overflow-y: auto;
`;

// All the following paths must show the explorer sidebar
// TODO(abhinav): Figure out how to make the explorer the sidebar
// the default, if any other sidebar paths donot match
const allExplorerURLS = [
  BUILDER_URL,
  API_EDITOR_URL(),
  API_EDITOR_ID_URL(),
  QUERIES_EDITOR_URL(),
  QUERIES_EDITOR_ID_URL(),
  DATA_SOURCES_EDITOR_URL(),
  DATA_SOURCES_EDITOR_ID_URL(),
  getProviderTemplatesURL(),
  getCurlImportPageURL(),
];

const explorerSidebarRoutes = allExplorerURLS.map(url => (
  <AppRoute
    exact
    key={url}
    path={url}
    component={ExplorerSidebar}
    name={"ExplorerSidebar"}
  />
));

/* eslint-disable react/display-name */
export const Sidebar = memo(() => {
  return (
    <SidebarWrapper className="t--sidebar">
      <Switch>
        <AppRoute
          exact
          path={WIDGETS_URL()}
          component={WidgetSidebar}
          name={"WidgetSidebar"}
        />
        {explorerSidebarRoutes}
      </Switch>
    </SidebarWrapper>
  );
});

export default Sidebar;
