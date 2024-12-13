import React from "react";
import SettingsModalView from "./SettingsModalView";
import { useGitContext } from "../GitContextProvider";

function SettingsModal() {
  const {
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
    settingsModalOpen,
    settingsModalTab,
    toggleSettingsModal,
  } = useGitContext();

  return (
    <SettingsModalView
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      isSettingsModalOpen={settingsModalOpen}
      settingsModalTab={settingsModalTab}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default SettingsModal;
