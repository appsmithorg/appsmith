import React from "react";
import ConflictErrorModal from "./ConflictErrorModal";
import GitSettingsModal from "./GitSettingsModal";
import OpsModal from "./OpsModal";

export default function GitModals() {
  return (
    <>
      <OpsModal />
      <GitSettingsModal />
      <ConflictErrorModal />
    </>
  );
}
