import React, { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { currentWorkflowEditorURL } from "@appsmith/RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import useCurrentWorkflowState from "../hooks";
import { BottomButtons } from "../constants";
import SidebarComponent from "pages/Editor/IDE/Sidebar/SidebarComponent";
import { TopButtons } from "entities/IDE/constants";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentWorkflowState();
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  const onClick = useCallback((suffix) => {
    const url = currentWorkflowEditorURL();
    history.push(`${url}/${suffix}`, {
      invokedBy: NavigationMethod.WorkflowSidebar,
    });
  }, []);

  return (
    <SidebarComponent
      appState={appState}
      bottomButtons={BottomButtons}
      isAppSidebarAnnouncementEnabled={false}
      onClick={onClick}
      topButtons={TopButtons}
    />
  );
}

export default Sidebar;
