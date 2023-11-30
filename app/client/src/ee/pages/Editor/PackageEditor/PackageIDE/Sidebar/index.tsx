import React, { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { currentPackageEditorURL } from "@appsmith/RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import useCurrentPackageState from "../hooks";
import { BottomButtons } from "../constants";
import SidebarComponent from "pages/Editor/IDE/Sidebar/SidebarComponent";
import { TopButtons } from "entities/IDE/constants";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentPackageState();
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  const onClick = useCallback((suffix) => {
    const url = currentPackageEditorURL();
    history.push(`${url}/${suffix}`, {
      invokedBy: NavigationMethod.PackageSidebar,
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
