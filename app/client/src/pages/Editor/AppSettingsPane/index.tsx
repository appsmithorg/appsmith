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

  // Close app settings pane when clicked outside
  useOnClickOutside([paneRef, portalRef], (event) => {
    if (document.getElementById("save-theme-modal")) return;
    if (document.getElementById("delete-theme-modal")) return;
    if (document.getElementById("manual-upgrades-modal")) return;
    if (document.getElementById("confirm-fork-modal")) return;

    // If logo configuration navigation setting dropdown is open
    if (
      document.getElementsByClassName(
        "t--navigation-settings-logo-configuration",
      )?.[0] &&
      document.getElementsByClassName("bp3-overlay-open")?.[0]
    ) {
      return;
    }

    // No id property for `Dialog` component, so using class name
    if (document.querySelector(".t--import-application-modal")) {
      return;
    }

    // When we select a new theme font
    if (
      document
        .querySelector(".t--theme-font-dropdown")
        ?.contains(event?.target as Node)
    ) {
      return;
    }

    // When interacting with the save theme menu
    if (
      document
        .querySelector(".t--save-theme-menu")
        ?.contains(event?.target as Node)
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
      <AppSettings />
    </div>
  );
}

export default AppSettingsPane;
