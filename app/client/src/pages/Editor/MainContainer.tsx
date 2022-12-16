import * as Sentry from "@sentry/react";
import { default as React, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Switch, useLocation } from "react-router";
import styled from "styled-components";

import { updateExplorerWidthAction } from "actions/explorerActions";
import { routeChanged } from "actions/focusHistoryActions";
import classNames from "classnames";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "constants/routes";
import { previewModeSelector } from "selectors/editorSelectors";
import { getExplorerWidth } from "selectors/explorerSelector";
import { AppsmithLocationState } from "utils/history";
import BottomBar from "./BottomBar";
import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";

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
