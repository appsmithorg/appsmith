import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback } from "react";
import { Route, Switch, useRouteMatch } from "react-router";

import { updateExplorerWidthAction } from "actions/explorerActions";
import classNames from "classnames";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import { previewModeSelector } from "selectors/editorSelectors";
import { Installer } from "pages/Editor/Explorer/Libraries/Installer";
import { getExplorerWidth } from "selectors/explorerSelector";
import BottomBar from "./BottomBar";
import WidgetsEditor from "./WidgetsEditor";
import EditorsRouter from "./routes";
import styled from "styled-components";

const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div<{
  isPreviewMode: boolean;
}>`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => (props.isPreviewMode ? "0px" : props.theme.bottomBarHeight)}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

function MainContainer() {
  const dispatch = useDispatch();
  const sidebarWidth = useSelector(getExplorerWidth);
  const { path } = useRouteMatch();

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

  return (
    <>
      <Container
        className="relative w-full overflow-x-hidden"
        isPreviewMode={isPreviewMode}
      >
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
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={`${path}${WIDGETS_EDITOR_BASE_PATH}`}
            />
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={`${path}${WIDGETS_EDITOR_ID_PATH}`}
            />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </div>
      </Container>
      <BottomBar
        className={classNames({
          "translate-y-full bottom-0": isPreviewMode,
          "translate-y-0 opacity-100": !isPreviewMode,
          "transition-all transform duration-400": true,
        })}
      />
      <Installer left={sidebarWidth} />
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
