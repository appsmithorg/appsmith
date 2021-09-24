import React, { memo, useEffect, useRef } from "react";
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
// import Switcher from "components/ads/Switcher";
// import { useDispatch } from "react-redux";
// import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";

const SidebarWrapper = styled.div<{ inOnboarding: boolean }>`
  background-color: ${Colors.WHITE};
  padding: 0;
  width: ${(props) => props.theme.sidebarWidth};
  z-index: ${Layers.sideBar};
  box-shadow: 1px 0px 0px ${Colors.MERCURY_1};
  color: ${(props) => props.theme.colors.textOnWhiteBG};
  overflow-y: auto;
  & .${Classes.PANEL_STACK} {
    height: ${(props) =>
      props.inOnboarding
        ? `calc(100% - ${props.theme.onboarding.statusBarHeight}px - 48px)`
        : `calc(100% - 48px)`};
    .${Classes.PANEL_STACK_VIEW} {
      background: none;
    }
  }
`;

// const SwitchWrapper = styled.div`
//   padding: 8px;
// `;

const initialPanel = { component: ExplorerSidebar };

export const Sidebar = memo(() => {
  // const dispatch = useDispatch();
  const panelRef = useRef<PanelStack>(null);

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

  // const switches = [
  //   {
  //     id: "explorer",
  //     text: "Explorer",
  //     action: () => {
  //       dispatch(forceOpenWidgetPanel(false));
  //       panelRef && panelRef.current && panelRef.current?.closePanel();
  //     },
  //   },
  //   {
  //     id: "widgets",
  //     text: "Widgets",
  //     action: () => dispatch(forceOpenWidgetPanel(true)),
  //   },
  // ];

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
      {/* <SwitchWrapper>
        <Switcher switches={switches} />
      </SwitchWrapper> */}
      <PanelStack
        initialPanel={initialPanel}
        ref={panelRef}
        showPanelHeader={false}
      />
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sentry.withProfiler(Sidebar);
