import React from "react";
import ConflictErrorModal from "./ConflictErrorModal";
import SettingsModal from "./SettingsModal";
import OpsModal from "./OpsModal";

export default function GitModals() {
  return (
    <>
      <OpsModal />
      <SettingsModal />
      <ConflictErrorModal />
    </>
  );
}
