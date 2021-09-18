import { IPanelProps } from "@blueprintjs/core";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { inOnboarding, isAddWidgetComplete } from "sagas/OnboardingSagas";
import WidgetSidebar from "../WidgetSidebar";
import EntityExplorer from "./EntityExplorer";
import OnboardingExplorer from "./Onboarding";

function ExplorerContent(props: IPanelProps) {
  const isInOnboarding = useSelector(inOnboarding);
  const addWidgetComplete = useSelector(isAddWidgetComplete);
  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (isForceOpenWidgetPanel) {
      props.openPanel({ component: WidgetSidebar });
    }
    return () => {
      if (isForceOpenWidgetPanel) {
        dispatch(forceOpenWidgetPanel(false));
      }
    };
  }, [isForceOpenWidgetPanel]);

  if (isInOnboarding && !addWidgetComplete) {
    return <OnboardingExplorer {...props} />;
  }

  return <EntityExplorer {...props} />;
}

export default ExplorerContent;
