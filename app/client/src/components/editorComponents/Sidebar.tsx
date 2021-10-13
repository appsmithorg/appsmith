import React, { memo, useEffect, useState } from "react";
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
import Switcher from "components/ads/Switcher";
import { useDispatch } from "react-redux";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";

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

const SwitchWrapper = styled.div`
  padding: 8px;
`;

const initialPanel = { component: ExplorerSidebar };

export const Sidebar = memo(() => {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const switches = [
    {
      id: "explorer",
      text: "Explorer",
      action: () => dispatch(forceOpenWidgetPanel(false)),
    },
    {
      id: "widgets",
      text: "Widgets",
      action: () => {
        !(
          BUILDER_PAGE_URL(applicationId, pageId) === window.location.pathname
        ) && history.push(BUILDER_PAGE_URL(applicationId, pageId));
        setTimeout(() => dispatch(forceOpenWidgetPanel(true)), 0);
        if (isFirstTimeUserOnboardingEnabled) {
          dispatch(toggleInOnboardingWidgetSelection(true));
        }
      },
    },
  ];
  const [activeSwitch, setActiveSwitch] = useState(switches[0]);

  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );

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

  useEffect(() => {
    if (isForceOpenWidgetPanel) {
      setActiveSwitch(switches[1]);
    } else {
      setActiveSwitch(switches[0]);
    }
  }, [isForceOpenWidgetPanel]);

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
      <SwitchWrapper>
        <Switcher activeObj={activeSwitch} switches={switches} />
      </SwitchWrapper>
      <PanelStack initialPanel={initialPanel} showPanelHeader={false} />
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sentry.withProfiler(Sidebar);
