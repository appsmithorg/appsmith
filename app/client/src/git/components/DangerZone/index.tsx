import useAutocommit from "git/hooks/useAutocommit";
import useDisconnect from "git/hooks/useDisconnect";
import useSettings from "git/hooks/useSettings";
import React, { useCallback } from "react";
import DangerZoneView from "./DangerZoneView";
import useMetadata from "git/hooks/useMetadata";
import { useGitContext } from "../GitContextProvider";
import useGenerateDeployKey from "git/hooks/useGenerateDeployKey";

function DangerZone() {
  const {
    artifact,
    artifactDef,
    isConnectPermitted,
    isManageAutocommitPermitted,
  } = useGitContext();
  const { closeDisconnectModal, openDisconnectModal } = useDisconnect();
  const {
    isAutocommitEnabled,
    isToggleAutocommitLoading,
    toggleAutocommit,
    toggleAutocommitDisableModal,
  } = useAutocommit();
  const { toggleGenerateSSHKeyModal } = useGenerateDeployKey();
  const { toggleSettingsModal } = useSettings();
  const { isFetchMetadataLoading } = useMetadata();

  const handleOpenDisconnectModal = useCallback(() => {
    if (artifactDef && artifact) {
      openDisconnectModal(artifactDef, artifact?.name ?? "");
    }
  }, [artifactDef, artifact, openDisconnectModal]);

  const handleOpenGenerateDeployKeyModal = useCallback(() => {
    if (artifactDef && artifact) {
      toggleGenerateSSHKeyModal(true);
    }
  }, [artifactDef, artifact, toggleGenerateSSHKeyModal]);

  return (
    <DangerZoneView
      closeDisconnectModal={closeDisconnectModal}
      isAutocommitEnabled={isAutocommitEnabled}
      isConnectPermitted={isConnectPermitted}
      isFetchMetadataLoading={isFetchMetadataLoading}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isToggleAutocommitLoading={isToggleAutocommitLoading}
      openDisconnectModal={handleOpenDisconnectModal}
      openGenerateDeployKeyModal={handleOpenGenerateDeployKeyModal}
      toggleAutocommit={toggleAutocommit}
      toggleDisableAutocommitModal={toggleAutocommitDisableModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default DangerZone;
