import React, { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import { useCurrentAppState } from "../hooks";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import SidebarComponent from "./SidebarComponent";
import { BottomButtons, TopButtons } from "@appsmith/entities/IDE/constants";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const pageId = useSelector(getCurrentPageId);

  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  const onClick = useCallback(
    (suffix) => {
      history.push(
        builderURL({
          pageId,
          suffix,
        }),
        {
          invokedBy: NavigationMethod.AppSidebar,
        },
      );
    },
    [pageId],
  );

  return (
    <SidebarComponent
      appState={appState}
      bottomButtons={BottomButtons}
      onClick={onClick}
      topButtons={TopButtons}
    />
  );
}

export default Sidebar;
