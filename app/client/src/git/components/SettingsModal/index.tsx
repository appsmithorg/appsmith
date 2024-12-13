import React from "react";
import SettingsModalView from "./SettingsModalView";
import { useGitContext } from "../GitContextProvider";
import useGitPermissions from "git/hooks/useGitPermissions";

function SettingsModal() {
  const { settingsModalOpen, settingsModalTab, toggleSettingsModal } =
    useGitContext();

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
      isSettingsModalOpen={settingsModalOpen}
      settingsModalTab={settingsModalTab}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default SettingsModal;
