import React from "react";
import SettingsModalView from "./SettingsModalView";
import useGitPermissions from "git/hooks/useGitPermissions";
import useSettings from "git/hooks/useSettings";

function SettingsModal() {
  const { isSettingsModalOpen, settingsModalTab, toggleSettingsModal } =
    useSettings();

  const {
    isConnectPermitted,
    isManageAutocommitPermitted,
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
  } = useGitPermissions();

  return (
    <SettingsModalView
      isConnectPermitted={isConnectPermitted}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      isSettingsModalOpen={isSettingsModalOpen}
      settingsModalTab={settingsModalTab}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default SettingsModal;
