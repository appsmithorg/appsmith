import React from "react";
import ConflictErrorModal from "../ConflictErrorModal";
import SettingsModal from "../SettingsModal";
import OpsModal from "../OpsModal";
import DisconnectModal from "../DisconnectModal";
import DisableAutocommitModal from "../DisableAutocommitModal";
import ConnectModal from "../ConnectModal";

function GitModalsCE() {
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

export default GitModalsCE;
