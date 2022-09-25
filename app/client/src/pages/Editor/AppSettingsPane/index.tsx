import React from "react";
import AppSettings from "./AppSettings";
import PaneHeader from "./PaneHeader";

function AppSettingsPane() {
  return (
    <div className="h-full">
      <div className="absolute inset-0 h-0" id="app-settings-portal" />
      <PaneHeader />
      <AppSettings />
    </div>
  );
}

export default AppSettingsPane;
