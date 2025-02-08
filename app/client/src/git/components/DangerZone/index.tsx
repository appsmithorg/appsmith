import useAutocommit from "git/hooks/useAutocommit";
import useDisconnect from "git/hooks/useDisconnect";
import useGitPermissions from "git/hooks/useGitPermissions";
import useSettings from "git/hooks/useSettings";
import React, { useCallback } from "react";
import DangerZoneView from "./DangerZoneView";
import useMetadata from "git/hooks/useMetadata";
import { useGitContext } from "../GitContextProvider";

function DangerZone() {
  const { artifact, artifactDef } = useGitContext();
  const { closeDisconnectModal, openDisconnectModal } = useDisconnect();
  const { isConnectPermitted, isManageAutocommitPermitted } =
    useGitPermissions();
  const {
    isAutocommitEnabled,
    isToggleAutocommitLoading,
    toggleAutocommit,
    toggleAutocommitDisableModal,
  } = useAutocommit();
  const { toggleSettingsModal } = useSettings();
  const { isFetchMetadataLoading } = useMetadata();

  const handleOpenDisconnectModal = useCallback(() => {
    if (artifactDef && artifact) {
      openDisconnectModal(artifactDef, artifact?.name ?? "");
    }
  }, [artifactDef, artifact, openDisconnectModal]);

  return (
    <DangerZoneView
      closeDisconnectModal={closeDisconnectModal}
      isAutocommitEnabled={isAutocommitEnabled}
      isConnectPermitted={isConnectPermitted}
      isFetchMetadataLoading={isFetchMetadataLoading}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isToggleAutocommitLoading={isToggleAutocommitLoading}
      openDisconnectModal={handleOpenDisconnectModal}
      toggleAutocommit={toggleAutocommit}
      toggleDisableAutocommitModal={toggleAutocommitDisableModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default DangerZone;
