import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useState, useCallback } from "react";
import { Route, Switch } from "react-router";

import EditorsRouter from "./routes";
import BottomBar from "./BottomBar";
import { DEFAULT_ENTITY_EXPLORER_WIDTH } from "constants/AppConstants";
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
import AppSettings from "./AppSettings";
import { tailwindLayers } from "constants/Layers";
import { getIsAppSettingsPaneOpen } from "selectors/appSettingsPaneSelectors";
import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";

const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

const AppSettingsPane = styled.div`
  width: 521px;
  height: 100%;
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  background: #fff;
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

  const isPreviewMode = useSelector(previewModeSelector);
  const isAppSettingsPaneOpen = useSelector(getIsAppSettingsPaneOpen);

  const closeAppSettingPane = () => dispatch(closeAppSettingsPaneAction());

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
        <AppSettingsPane
          className={classNames({
            [`absolute ${tailwindLayers.appSettingsPane} right-0`]: true,
            "translate-x-0": isAppSettingsPaneOpen,
            "translate-x-full": !isAppSettingsPaneOpen,
            "transition-all transform duration-400": true,
          })}
        >
          <button onClick={closeAppSettingPane}>close panel</button>
          <AppSettings />
        </AppSettingsPane>
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
