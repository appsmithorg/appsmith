import React, { useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Route, Switch, matchPath, useLocation } from "react-router";
import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import BottomBar from "./BottomBar";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import PropertyPaneSidebar from "components/editorComponents/PropertyPaneSidebar";

import getFeatureFlags from "utils/featureFlags";

import { BUILDER_CHECKLIST_URL, BUILDER_URL } from "constants/routes";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
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
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(256);

  /**
   * on entity explorer sidebar width change
   *
   * @return void
   */
  const onLeftSidebarWidthChange = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
  }, []);

  /**
   * checks if property pane should be rendered or not
   *
   * @return boolean
   */
  const shouldRenderPropertyPane = useMemo(() => {
    const match = matchPath(location.pathname, {
      path: BUILDER_URL,
      exact: true,
    });

    // match is found, that means current URL is BUILDER_URL i.e our editor
    if (match) return true;

    return false;
  }, [location]);

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
            <SentryRoute
              component={OnboardingChecklist}
              exact
              path={BUILDER_CHECKLIST_URL}
            />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </div>
        {shouldRenderPropertyPane && <PropertyPaneSidebar />}
      </Container>
      {getFeatureFlags().GIT && <BottomBar />}
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
