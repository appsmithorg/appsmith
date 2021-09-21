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

const SidebarWrapper = styled.div`
  background-color: ${Colors.WHITE};
  padding: 0;
  width: ${(props) => props.theme.sidebarWidth};
  z-index: ${Layers.sideBar};
  box-shadow: 1px 0px 0px ${Colors.MERCURY_1};
  color: ${(props) => props.theme.colors.textOnWhiteBG};
  overflow-y: auto;
  & .${Classes.PANEL_STACK} {
    height: 100%;
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
    <SidebarWrapper className="t--sidebar">
      {(enableFirstTimeUserOnboarding || isFirstTimeUserOnboardingComplete) && (
        <OnboardingStatusbar />
      )}
      <PanelStack initialPanel={initialPanel} showPanelHeader={false} />
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sentry.withProfiler(Sidebar);
