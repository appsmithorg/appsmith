import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useDispatch } from "react-redux";
import React, { useState, useCallback } from "react";
import { Route, Switch } from "react-router";

import EditorsRouter from "./routes";
import BottomBar from "./BottomBar";
import { DEFAULT_ENTITY_EXPLORER_WIDTH } from "constants/AppConstants";
import WidgetsEditor from "./WidgetsEditor";
import { updateExplorerWidthAction } from "actions/explorerActions";
import { BUILDER_CHECKLIST_URL, BUILDER_URL } from "constants/routes";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";

const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;
function MainContainer() {
  const dispatch = useDispatch();
  const [sidebarWidth, setSidebarWidth] = useState(
    DEFAULT_ENTITY_EXPLORER_WIDTH,
  );

  /**
   * on entity explorer sidebar width change
   *
   * @return void
   */
  const onLeftSidebarWidthChange = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
  }, []);

  /**
   * on entity explorer sidebar drag end
   *
   * @return void
   */
  const onLeftSidebarDragEnd = useCallback(() => {
    dispatch(updateExplorerWidthAction(sidebarWidth));
  }, [sidebarWidth]);

  return (
    <>
      <Container className="w-full overflow-x-hidden">
        <EntityExplorerSidebar
          onDragEnd={onLeftSidebarDragEnd}
          onWidthChange={onLeftSidebarWidthChange}
          width={sidebarWidth}
        />
        <div
          className="relative flex flex-col w-full overflow-auto"
          id="app-body"
        >
          <Switch key={BUILDER_URL}>
            <SentryRoute component={WidgetsEditor} exact path={BUILDER_URL} />
            <SentryRoute
              component={OnboardingChecklist}
              exact
              path={BUILDER_CHECKLIST_URL}
            />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </div>
      </Container>
      <BottomBar />
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
