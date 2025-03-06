import React from "react";
import SettingsModalView from "./SettingsModalView";
import useSettings from "git/hooks/useSettings";
import { GitSettingsTab } from "git/constants/enums";
import { useGitContext } from "../GitContextProvider";

function SettingsModal() {
  const {
    isConnectPermitted,

    isManageAutocommitPermitted,
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
  } = useGitContext();
  const { isSettingsModalOpen, settingsModalTab, toggleSettingsModal } =
    useSettings();

  return (
    <SettingsModalView
      isConnectPermitted={isConnectPermitted}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      isSettingsModalOpen={isSettingsModalOpen}
      settingsModalTab={settingsModalTab ?? GitSettingsTab.General}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default SettingsModal;
