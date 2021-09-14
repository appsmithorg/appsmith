import { IPanelProps } from "@blueprintjs/core";
import React from "react";
import { useSelector } from "react-redux";
import { inOnboarding, isAddWidgetComplete } from "sagas/OnboardingSagas";
import EntityExplorer from "./EntityExplorer";
import OnboardingExplorer from "./Onboarding";

import log from "loglevel";
function ExplorerContent(
  props: IPanelProps & { pinned: boolean; onPin: () => void },
) {
  log.debug({ pinned: props.pinned });
  const isInOnboarding = useSelector(inOnboarding);
  const addWidgetComplete = useSelector(isAddWidgetComplete);

  if (isInOnboarding && !addWidgetComplete) {
    return <OnboardingExplorer {...props} />;
  }

  return <EntityExplorer {...props} />;
}

export default ExplorerContent;
