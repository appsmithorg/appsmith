import { IPanelProps } from "@blueprintjs/core";
import React from "react";
import { useSelector } from "react-redux";
import { inOnboarding, isAddWidgetComplete } from "sagas/OnboardingSagas";
import {
  getFirstTimeUserExperienceComplete,
  getIsFirstTimeUserExperienceEnabled,
} from "selectors/onboardingSelectors";
import OnboardingStatusbar from "../FirstTimeUserExperience/Statusbar";
import EntityExplorer from "./EntityExplorer";
import OnboardingExplorer from "./Onboarding";

function ExplorerContent(props: IPanelProps) {
  const isInOnboarding = useSelector(inOnboarding);
  const addWidgetComplete = useSelector(isAddWidgetComplete);
  const enableFirstTimeUserExperience = useSelector(
    getIsFirstTimeUserExperienceEnabled,
  );
  const isFirstTimeUserExperienceComplete = useSelector(
    getFirstTimeUserExperienceComplete,
  );

  if (isInOnboarding && !addWidgetComplete) {
    return <OnboardingExplorer {...props} />;
  }

  return (
    <>
      {(enableFirstTimeUserExperience || isFirstTimeUserExperienceComplete) && (
        <OnboardingStatusbar />
      )}
      <EntityExplorer {...props} />
    </>
  );
}

export default ExplorerContent;
