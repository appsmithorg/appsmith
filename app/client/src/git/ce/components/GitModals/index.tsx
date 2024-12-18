import ConflictErrorModal from "git/components/ConflictErrorModal";
import DisableAutocommitModal from "git/components/DisableAutocommitModal";
import DisconnectModal from "git/components/DisconnectModal";
import OpsModal from "git/components/OpsModal";
import SettingsModal from "git/components/SettingsModal";
import React from "react";

function GitModals() {
  return (
    <>
      <OpsModal />
      <SettingsModal />
      <DisconnectModal />
      <DisableAutocommitModal />
      <ConflictErrorModal />
    </>
  );
}

export default GitModals;
