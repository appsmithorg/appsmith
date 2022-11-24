import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";
import AppSettings from "./AppSettings";
import PaneHeader from "./PaneHeader";

function AppSettingsPane() {
  const dispatch = useDispatch();
  const paneRef = useRef(null);
  const portalRef = useRef(null);

  useOnClickOutside([paneRef, portalRef], () => {
    if (document.getElementById("save-theme-modal")) return;
    if (document.getElementById("delete-theme-modal")) return;
    if (document.getElementById("manual-upgrades-modal")) return;
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
      <AppSettings />
    </div>
  );
}

export default AppSettingsPane;
