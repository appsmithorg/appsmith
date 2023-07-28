import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback } from "react";
import { Route, Switch, useRouteMatch } from "react-router";

import { updateExplorerWidthAction } from "actions/explorerActions";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import {
  getIsAutoLayout,
  previewModeSelector,
} from "selectors/editorSelectors";
import { Installer } from "pages/Editor/Explorer/Libraries/Installer";
import { getExplorerWidth } from "selectors/explorerSelector";
import WidgetsEditor from "./WidgetsEditor";
import EditorsRouter from "./routes";
import styled from "styled-components";
import BottomBar from "components/BottomBar";
import { DRAG_IMAGE_HEIGHT } from "./useDragImageGenerator";

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
  const isAutoLayout = useSelector(getIsAutoLayout);
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
      <BottomBar viewMode={isPreviewMode} />
      <Installer left={sidebarWidth} />
      {isAutoLayout && (
        <canvas
          height={DRAG_IMAGE_HEIGHT}
          id="widget-drag-image"
          style={{
            position: "absolute",
            zIndex: 11,
            left: "-100px",
          }}
          width={100}
        />
      )}
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
