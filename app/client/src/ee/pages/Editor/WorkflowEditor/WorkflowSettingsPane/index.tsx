import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import PaneHeader from "pages/Editor/AppSettingsPane/PaneHeader";
import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";
import WorkflowSettings from "./WorkflowSettings";

function AppSettingsPane() {
  const dispatch = useDispatch();
  const paneRef = useRef(null);
  const portalRef = useRef(null);

  // Close app settings pane when clicked outside
  useOnClickOutside([paneRef, portalRef], () => {
    // If logo configuration navigation setting dropdown is open
    if (
      document.getElementsByClassName(
        "t--navigation-settings-logo-configuration",
      )?.[0] &&
      document.getElementsByClassName("bp3-overlay-open")?.[0]
    ) {
      return;
    }

    dispatch(closeAppSettingsPaneAction());
  });

  return (
    <div className="h-full" ref={paneRef}>
      <div
        className="absolute inset-0 h-0"
        id="app-settings-portal"
        ref={portalRef}
      />
      <PaneHeader />
      <WorkflowSettings />
    </div>
  );
}

export default AppSettingsPane;
