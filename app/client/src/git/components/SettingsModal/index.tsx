import React from "react";
import SettingsModalView from "./SettingsModalView";
import useSettings from "git/hooks/useSettings";
import { GitSettingsTab } from "git/constants/enums";
import { useGitContext } from "../GitContextProvider";
import isContinuousDeliveryEnabled from "git/helpers/isContinuousDeliveryEnabled";

function SettingsModal() {
  const { artifactDef } = useGitContext();
  const {
    isConnectPermitted,

    isManageAutocommitPermitted,
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
  } = useGitContext();
  const { isSettingsModalOpen, settingsModalTab, toggleSettingsModal } =
    useSettings();

  const showBranchTab =
    isManageDefaultBranchPermitted || isManageProtectedBranchesPermitted;
  const showCDTab = artifactDef
    ? isContinuousDeliveryEnabled(artifactDef)
    : false;

  return (
    <SettingsModalView
      isConnectPermitted={isConnectPermitted}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      isSettingsModalOpen={isSettingsModalOpen}
      settingsModalTab={settingsModalTab ?? GitSettingsTab.General}
      showBranchTab={showBranchTab}
      showCDTab={showCDTab}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default SettingsModal;
