import React from "react";
import { Switch } from "react-router";
import styled from "styled-components";
import {
  API_EDITOR_URL,
  BUILDER_URL,
  API_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  QUERIES_EDITOR_URL,
  QUERIES_EDITOR_ID_URL,
  getCurlImportPageURL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  EXPLORER_URL,
  getProviderTemplatesURL,
} from "constants/routes";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import ExplorerSidebar from "pages/Editor/Explorer";
import AppRoute from "pages/common/AppRoute";

const SidebarWrapper = styled.div`
  background-color: ${props => props.theme.colors.paneBG};
  padding: 5px 0;
  color: ${props => props.theme.colors.textOnDarkBG};
  overflow-y: auto;
`;

export const Sidebar = () => {
  return (
    <SidebarWrapper className="t--sidebar">
      <Switch>
        <AppRoute
          exact
          path={BUILDER_URL}
          component={WidgetSidebar}
          name={"WidgetSidebar"}
        />
        <AppRoute
          exact
          path={API_EDITOR_URL()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />
        <AppRoute
          exact
          path={API_EDITOR_ID_URL()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />
        <AppRoute
          exact
          path={EXPLORER_URL()}
          component={ExplorerSidebar}
          name="ExplorerSidebar"
        />

        <AppRoute
          exact
          path={getCurlImportPageURL()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />
        <AppRoute
          exact
          path={getProviderTemplatesURL()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />

        <AppRoute
          exact
          path={API_EDITOR_URL_WITH_SELECTED_PAGE_ID()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />
        <AppRoute
          exact
          path={QUERIES_EDITOR_URL()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />
        <AppRoute
          exact
          path={QUERIES_EDITOR_ID_URL()}
          component={ExplorerSidebar}
          name={"ExplorerSidebar"}
        />
        <AppRoute
          exact
          path={DATA_SOURCES_EDITOR_URL()}
          component={ExplorerSidebar}
          name="ExplorerSidebar"
        />
        <AppRoute
          exact
          path={DATA_SOURCES_EDITOR_ID_URL()}
          component={ExplorerSidebar}
          name="ExplorerSidebar"
        />
      </Switch>
    </SidebarWrapper>
  );
};

Sidebar.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default Sidebar;
