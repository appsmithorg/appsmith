import React, { useCallback, useEffect } from "react";
import { getIsAppSidebarAnnouncementEnabled } from "selectors/ideSelectors";
import { useSelector, useDispatch } from "react-redux";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import useCurrentAppState from "../hooks";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { inGuidedTour } from "selectors/onboardingSelectors";
import SidebarComponent from "./SidebarComponent";
import { BottomButtons, TopButtons } from "entities/IDE/constants";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const isAppSidebarAnnouncementEnabled = useSelector(
    getIsAppSidebarAnnouncementEnabled,
  );
  const pageId = useSelector(getCurrentPageId);

  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const guidedTourEnabled = useSelector(inGuidedTour);

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

  if (guidedTourEnabled) {
    return null;
  }

  return (
    <SidebarComponent
      appState={appState}
      bottomButtons={BottomButtons}
      isAppSidebarAnnouncementEnabled={isAppSidebarAnnouncementEnabled}
      onClick={onClick}
      topButtons={TopButtons}
    />
  );
}

export default Sidebar;
