import ConflictErrorModal from "git/components/ConflictErrorModal";
import ConnectModal from "git/components/ConnectModal";
import DisableAutocommitModal from "git/components/DisableAutocommitModal";
import DisconnectModal from "git/components/DisconnectModal";
import OpsModal from "git/components/OpsModal";
import SettingsModal from "git/components/SettingsModal";
import React from "react";

function GitModals() {
  return (
    <>
      <ConnectModal />
      <OpsModal />
      <SettingsModal />
      <DisconnectModal />
      <DisableAutocommitModal />
      <ConflictErrorModal />
    </>
  );
}

export default GitModals;
