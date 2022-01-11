import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useState, useCallback } from "react";
import {
  matchPath,
  Route,
  Switch,
  useHistory,
  useLocation,
} from "react-router";

import EditorsRouter from "./routes";
import BottomBar from "./BottomBar";
import { DEFAULT_ENTITY_EXPLORER_WIDTH } from "constants/AppConstants";
import WidgetsEditor from "./WidgetsEditor";
import { updateExplorerWidthAction } from "actions/explorerActions";
import { BUILDER_CHECKLIST_URL, BUILDER_URL } from "constants/routes";
import OnboardingChecklist from "./FirstTimeUserOnboarding/Checklist";
import EntityExplorerSidebar from "components/editorComponents/Sidebar";
import { AppState } from "reducers";
import { Link } from "react-router-dom";
import { EditorTab } from "reducers/uiReducers/editorReducer";
import { trimQueryString } from "utils/helpers";
import { ControlIcons } from "icons/ControlIcons";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { pageIcon } from "./Explorer/ExplorerIcons";

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
      <Container className="w-full overflow-x-hidden flex flex-row">
        <EntityExplorerSidebar
          onDragEnd={onLeftSidebarDragEnd}
          onWidthChange={onLeftSidebarWidthChange}
          width={sidebarWidth}
        />
        <AppBody />
      </Container>
      <BottomBar />
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;

const CloseTabIcon = ControlIcons.CLOSE_CONTROL;

function AppBody() {
  const editorTabs: [EditorTab] = useSelector(
    (state: AppState) => state.ui.editor.editorTabs,
  );
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { pathname } = location;
  const hideCanvas = matchPath(pathname, {
    path: BUILDER_URL,
    exact: true,
  })
    ? ""
    : "hidden";

  const handleTabClose = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({
      type: ReduxActionTypes.CLOSE_EDITOR_TAB,
      payload: id,
    });

    history.push(editorTabs[0].url);
  };

  return (
    <div className="relative flex flex-col w-full overflow-auto">
      <div className="w-full border-b border-gray-200 z-30 bg-white sticky top-0 flex flex-row gap-2 items-center">
        {editorTabs.map((path, idx) => {
          const trimmedQueryPath = trimQueryString(path.url);
          const icon = path.icon || null;
          return (
            <Link
              key={`${path.id}`}
              style={{ textDecoration: "none" }}
              to={path.url}
            >
              <div
                className={`flex flex-row justify-between items-center px-2 py-2 gap-2 ${
                  idx !== 0 ? "min-w-32" : "w-8"
                } ${
                  pathname === trimmedQueryPath
                    ? "border-b-2 border-red-300"
                    : ""
                }`}
              >
                {idx === 0 && pageIcon}
                {icon}
                <span className="overflow-hidden overflow-ellipsis">
                  {path.name}
                </span>
                {idx !== 0 && (
                  <CloseTabIcon
                    className="flex-shrink-0"
                    color="black"
                    height={14}
                    onClick={(e) => handleTabClose(e, path.id)}
                    width={14}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="w-full flex flex-row" id="app-body">
        <div className={`w-full ${hideCanvas}`}>
          <WidgetsEditor />
        </div>
        <Switch>
          <SentryRoute
            component={OnboardingChecklist}
            exact
            path={BUILDER_CHECKLIST_URL}
          />
          <SentryRoute component={EditorsRouter} />
        </Switch>
      </div>
    </div>
  );
}
