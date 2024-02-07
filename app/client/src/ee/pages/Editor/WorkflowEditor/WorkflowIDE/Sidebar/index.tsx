import React, { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { currentWorkflowEditorURL } from "@appsmith/RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import useCurrentWorkflowState from "../hooks";
import { BottomButtons } from "../constants";
import SidebarComponent from "pages/Editor/IDE/Sidebar/SidebarComponent";
import { EditorState, TopButtons } from "@appsmith/entities/IDE/constants";
import { getMainJsObjectIdOfCurrentWorkflow } from "@appsmith/selectors/workflowSelectors";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentWorkflowState();
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const mainCollectionId = useSelector(getMainJsObjectIdOfCurrentWorkflow);

  const updatedTopButtons = TopButtons.map((button) => {
    if (button.state === EditorState.EDITOR) {
      return {
        ...button,
        urlSuffix: `jsObjects/${mainCollectionId || ""}`,
      };
    }
    return button;
  });

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
      onClick={onClick}
      topButtons={updatedTopButtons}
    />
  );
}

export default Sidebar;
