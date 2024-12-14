import React from "react";
import ConflictErrorModal from "../ConflictErrorModal";
import SettingsModal from "../SettingsModal";
import OpsModal from "../OpsModal";
import DisconnectModal from "../DisconnectModal";
import DisableAutocommitModal from "../DisableAutocommitModal";

function GitModalsCE() {
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

export default GitModalsCE;
