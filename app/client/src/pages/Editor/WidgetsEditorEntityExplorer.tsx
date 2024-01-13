import React from "react";
import { useSelector } from "react-redux";

import EntityProperties from "./Explorer/Entity/EntityProperties";
import Explorer from "./Explorer";
import OnboardingStatusbar from "./FirstTimeUserOnboarding/Statusbar";
import Pages from "./Explorer/Pages";
import EntityExplorerSidebar from "components/editorComponents/EntityExplorerSidebar";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";

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
