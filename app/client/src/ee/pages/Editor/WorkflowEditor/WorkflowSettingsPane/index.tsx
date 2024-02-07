import PaneHeader from "pages/Editor/AppSettingsPane/PaneHeader";
import React, { useRef } from "react";
import WorkflowSettings from "./WorkflowSettings";

function AppSettingsPane() {
  const paneRef = useRef(null);
  const portalRef = useRef(null);

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
