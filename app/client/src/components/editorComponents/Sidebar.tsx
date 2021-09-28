import React, { memo, useEffect } from "react";
import styled from "styled-components";
import ExplorerSidebar from "pages/Editor/Explorer";
import { PanelStack, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import * as Sentry from "@sentry/react";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { Layers } from "constants/Layers";
import { useSelector } from "store";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";

const SidebarWrapper = styled.div<{ inOnboarding: boolean }>`
  background-color: ${Colors.MINE_SHAFT};
  padding: 0;
  width: ${(props) => props.theme.sidebarWidth};
  z-index: ${Layers.sideBar};

  color: ${(props) => props.theme.colors.textOnDarkBG};
  overflow-y: auto;
  & .${Classes.PANEL_STACK} {
    height: ${(props) =>
      props.inOnboarding
        ? `calc(100% - ${props.theme.onboarding.statusBarHeight}px)`
        : "100%"};
    .${Classes.PANEL_STACK_VIEW} {
      background: none;
    }
  }
`;

const initialPanel = { component: ExplorerSidebar };

export const Sidebar = memo(() => {
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  return (
    <SidebarWrapper
      className="t--sidebar"
      inOnboarding={
        enableFirstTimeUserOnboarding || isFirstTimeUserOnboardingComplete
      }
    >
      {(enableFirstTimeUserOnboarding || isFirstTimeUserOnboardingComplete) && (
        <OnboardingStatusbar />
      )}
      <PanelStack initialPanel={initialPanel} showPanelHeader={false} />
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sentry.withProfiler(Sidebar);
