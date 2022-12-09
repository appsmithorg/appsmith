import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback, useEffect } from "react";
import { Route, Switch, useLocation } from "react-router";

import EditorsRouter from "./routes";
import BottomBar from "./BottomBar";
import WidgetsEditor from "./WidgetsEditor";
import { updateExplorerWidthAction } from "actions/explorerActions";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "constants/routes";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import classNames from "classnames";
import { previewModeSelector } from "selectors/editorSelectors";
import { routeChanged } from "actions/focusHistoryActions";
import { getExplorerWidth } from "selectors/explorerSelector";
import { AppsmithLocationState } from "utils/history";

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
  const sidebarWidth = useSelector(getExplorerWidth);

  /**
   * on entity explorer sidebar width change
   *
   * @return void
   */
  const onLeftSidebarWidthChange = useCallback((newWidth) => {
    dispatch(updateExplorerWidthAction(newWidth));
  }, []);

  /**
   * on entity explorer sidebar drag end
   *
   * @return void
   */
  const onLeftSidebarDragEnd = useCallback(() => {
    dispatch(updateExplorerWidthAction(sidebarWidth));
  }, [sidebarWidth]);

  const isPreviewMode = useSelector(previewModeSelector);

  const location = useLocation<AppsmithLocationState>();

  useEffect(() => {
    dispatch(routeChanged(location));
  }, [location.pathname, location.hash]);

  return (
    <>
      <Container className="relative w-full overflow-x-hidden">
        <EntityExplorerSidebar
          onDragEnd={onLeftSidebarDragEnd}
          onWidthChange={onLeftSidebarWidthChange}
          width={sidebarWidth}
        />
        <div
          className="relative flex flex-col w-full overflow-auto"
          id="app-body"
        >
          <Switch key={BUILDER_PATH}>
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={BUILDER_PATH_DEPRECATED}
            />
            <SentryRoute component={WidgetsEditor} exact path={BUILDER_PATH} />
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={BUILDER_CUSTOM_PATH}
            />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </div>
      </Container>
      <BottomBar
        className={classNames({
          "translate-y-full fixed bottom-0": isPreviewMode,
          "translate-y-0 relative opacity-100": !isPreviewMode,
          "transition-all transform duration-400": true,
        })}
      />
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
