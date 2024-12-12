import React from "react";
import GitOpsModal from "./GitOpsModal";
import GitConflictErrorModal from "./GitConflictErrorModal";
import GitSettingsModal from "pages/Editor/gitSync/GitSettingsModal";

export default function GitModals() {
  return (
    <>
      <GitOpsModal />
      <GitSettingsModal />
      <GitConflictErrorModal />
    </>
  );
}
