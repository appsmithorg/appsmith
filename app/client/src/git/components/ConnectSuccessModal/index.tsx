import React from "react";
import ConnectSuccessModalView from "./ConnectSuccessModalView";
import useMetadata from "git/hooks/useMetadata";
import useConnect from "git/hooks/useConnect";
import useSettings from "git/hooks/useSettings";
import { useGitContext } from "../GitContextProvider";

function ConnectSuccessModal() {
  const { artifactDef, isManageProtectedBranchesPermitted } = useGitContext();
  const artifactType = artifactDef?.artifactType ?? null;
  const { isConnectSuccessModalOpen, toggleConnectSuccessModal } = useConnect();
  const { toggleSettingsModal } = useSettings();

  const { metadata } = useMetadata();

  const remoteUrl = metadata?.remoteUrl ?? null;
  const repoName = metadata?.repoName ?? null;
  const defaultBranch = metadata?.defaultBranchName ?? null;

  return (
    <ConnectSuccessModalView
      artifactType={artifactType}
      defaultBranch={defaultBranch}
      isConnectSuccessModalOpen={isConnectSuccessModalOpen}
      remoteUrl={remoteUrl}
      repoName={repoName}
      showProtectedBranchesInfo={isManageProtectedBranchesPermitted}
      toggleConnectSuccessModal={toggleConnectSuccessModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default ConnectSuccessModal;
