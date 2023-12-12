import React, { useCallback, useEffect } from "react";
import { getIsAppSidebarAnnouncementEnabled } from "selectors/ideSelectors";
import { useDispatch, useSelector } from "react-redux";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import useCurrentAppState from "../hooks";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { inGuidedTour } from "selectors/onboardingSelectors";
import SidebarComponent from "./SidebarComponent";
import { BottomButtons, EditorState, TopButtons } from "entities/IDE/constants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const isAppSidebarAnnouncementEnabled = useSelector(
    getIsAppSidebarAnnouncementEnabled,
  );
  const pageId = useSelector(getCurrentPageId);

  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const isPagePaneSegmentsEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled,
  );

  const SidebarTopButtons = TopButtons.filter((button) => {
    if (button.state === EditorState.ADD) {
      return isPagePaneSegmentsEnabled;
    }
    return true;
  });

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
      topButtons={SidebarTopButtons}
    />
  );
}

export default Sidebar;
