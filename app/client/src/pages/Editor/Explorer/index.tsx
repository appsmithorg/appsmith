import { IPanelProps } from "@blueprintjs/core";
import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { inOnboarding, isAddWidgetComplete } from "sagas/OnboardingSagas";
import WidgetSidebar from "../WidgetSidebar";
import EntityExplorer from "./EntityExplorer";
import OnboardingExplorer from "./Onboarding";

const isForceOpenWidgetPanelSelector = (state: AppState) =>
  state.ui.onBoarding.forceOpenWidgetPanel;

function ExplorerContent(props: IPanelProps) {
  const isInOnboarding = useSelector(inOnboarding);
  const addWidgetComplete = useSelector(isAddWidgetComplete);
  const isForceOpenWidgetPanel = useSelector(isForceOpenWidgetPanelSelector);
  useEffect(() => {
    if (isForceOpenWidgetPanel) {
      props.openPanel({ component: WidgetSidebar });
    }
  }, [isForceOpenWidgetPanel]);

  if (isInOnboarding && !addWidgetComplete) {
    return <OnboardingExplorer {...props} />;
  }

  return <EntityExplorer {...props} />;
}

export default ExplorerContent;
