import ConflictErrorModal from "git/components/ConflictErrorModal";
import ConnectModal from "git/components/ConnectModal";
import ConnectSuccessModal from "git/components/ConnectSuccessModal";
import DisableAutocommitModal from "git/components/DisableAutocommitModal";
import DisconnectModal from "git/components/DisconnectModal";
import OpsModal from "git/components/OpsModal";
import RepoLimitErrorModal from "git/components/RepoLimitErrorModal";
import SettingsModal from "git/components/SettingsModal";
import React from "react";
import GenerateDeployKeyModal from "git/components/GenerateDeployKeyModal";

function GitModals() {
  return (
    <>
      <ConnectModal />
      <ConnectSuccessModal />
      <RepoLimitErrorModal />
      <OpsModal />
      <SettingsModal />
      <DisconnectModal />
      <DisableAutocommitModal />
      <ConflictErrorModal />
      <GenerateDeployKeyModal />
    </>
  );
}

export default GitModals;
