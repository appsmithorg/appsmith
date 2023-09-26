import * as Sentry from "@sentry/react";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router";

import { updateExplorerWidthAction } from "actions/explorerActions";
import BottomBar from "components/BottomBar";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import { previewModeSelector } from "selectors/editorSelectors";
import { getExplorerWidth } from "selectors/explorerSelector";
import styled from "styled-components";
import WidgetsEditor from "./WidgetsEditor";
import EditorsRouter from "./routes";

const SentryRoute = Sentry.withSentryRouting(Route);

const Wrapper = styled.div`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

/**
 * OldName: MainContainer
 */
function WidgetsEditorWrapper() {
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
      <Wrapper className="relative w-full overflow-x-hidden">
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
      </Wrapper>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

WidgetsEditorWrapper.displayName = "WidgetsEditorWrapper";

export default WidgetsEditorWrapper;
