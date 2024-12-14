import useAutocommit from "git/hooks/useAutocommit";
import useDisconnect from "git/hooks/useDisconnect";
import useGitPermissions from "git/hooks/useGitPermissions";
import useSettings from "git/hooks/useSettings";
import React from "react";
import DangerZoneView from "./DangerZoneView";

function DangerZone() {
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

  return (
    <DangerZoneView
      closeDisconnectModal={closeDisconnectModal}
      isAutocommitEnabled={isAutocommitEnabled}
      isConnectPermitted={isConnectPermitted}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isMetadataLoading={false}
      isToggleAutocommitLoading={isToggleAutocommitLoading}
      openDisconnectModal={openDisconnectModal}
      toggleAutocommit={toggleAutocommit}
      toggleDisableAutocommitModal={toggleAutocommitDisableModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default DangerZone;
