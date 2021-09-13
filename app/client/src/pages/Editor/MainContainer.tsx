import React, { useState, useCallback } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Route, Switch } from "react-router";

import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import { BUILDER_URL } from "constants/routes";
import BottomBar from "./BottomBar";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import PropertyPaneSidebar from "components/editorComponents/PropertyPaneSidebar";

import getFeatureFlags from "utils/featureFlags";

const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) =>
        getFeatureFlags().GIT ? props.theme.bottomBarHeight : "0px"}
  );
  background-color: ${(props) => props.theme.appBackground};
`;
function MainContainer() {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [propertyPaneWidth, setPropertyPaneWidth] = useState(256);

  /**
   * on entity explorer sidebar width change
   */
  const onLeftSidebarWidthChange = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
  }, []);

  /**
   * on property pane sidebar width change
   */
  const onRightSidebarWidthChange = useCallback((newWidth) => {
    setPropertyPaneWidth(newWidth);
  }, []);

  return (
    <>
      <Container className="w-full justify-between">
        <EntityExplorerSidebar
          onWidthChange={onLeftSidebarWidthChange}
          width={sidebarWidth}
        />
        <div className="relative flex flex-col overflow-auto w-full">
          <Switch>
            <SentryRoute component={WidgetsEditor} exact path={BUILDER_URL} />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </div>
        <PropertyPaneSidebar
          onWidthChange={onRightSidebarWidthChange}
          width={propertyPaneWidth}
        />
      </Container>
      {getFeatureFlags().GIT && <BottomBar />}
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
