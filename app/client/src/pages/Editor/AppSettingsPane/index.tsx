import React, { useRef } from "react";
import AppSettings from "./AppSettings";
import PaneHeader from "./PaneHeader";

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
      <AppSettings />
    </div>
  );
}

export default AppSettingsPane;
