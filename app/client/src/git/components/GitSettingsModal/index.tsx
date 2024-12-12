import React from "react";
import DumbGitSettingsModal from "./DumbGitSettingsModal";
import { useGitContext } from "../GitContextProvider";

function GitSettingsModal() {
  const {
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
    settingsModalOpen,
    settingsModalTab,
    toggleSettingsModal,
  } = useGitContext();

  return (
    <DumbGitSettingsModal
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      isSettingsModalOpen={settingsModalOpen}
      settingsModalTab={settingsModalTab}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default GitSettingsModal;
