import useDisconnect from "git/hooks/useDisconnect";
import useSettings from "git/hooks/useSettings";
import React from "react";
import DisconnectModalView from "./DisconnectModalView";

function DisconnectModal() {
  const {
    closeDisconnectModal,
    disconnect,
    disconnectArtifactName,
    isDisconnectLoading,
    isDisconnectModalOpen,
  } = useDisconnect();

  const { toggleSettingsModal } = useSettings();

  return (
    <DisconnectModalView
      closeDisconnectModal={closeDisconnectModal}
      disconnect={disconnect}
      disconnectArtifactName={disconnectArtifactName}
      isDisconnectLoading={isDisconnectLoading}
      isDisconnectModalOpen={isDisconnectModalOpen}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default DisconnectModal;
