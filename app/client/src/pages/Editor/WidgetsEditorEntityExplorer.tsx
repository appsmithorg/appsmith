import React from "react";

import EntityExplorerSidebar from "components/editorComponents/EntityExplorerSidebar";
import { useSelector } from "react-redux";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";

import Explorer from "./Explorer";
import EntityProperties from "./Explorer/Entity/EntityProperties";
import Pages from "./Explorer/Pages";
import OnboardingStatusbar from "./FirstTimeUserOnboarding/Statusbar";

function WidgetsEditorEntityExplorer() {
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );

  return (
    <EntityExplorerSidebar>
      {enableFirstTimeUserOnboarding && <OnboardingStatusbar />}
      {/* PagesContainer */}
      <Pages />
      {/* Popover that contains the bindings info */}
      <EntityProperties />
      {/* Contains entity explorer & widgets library along with a switcher*/}
      <Explorer />
    </EntityExplorerSidebar>
  );
}

export default WidgetsEditorEntityExplorer;
