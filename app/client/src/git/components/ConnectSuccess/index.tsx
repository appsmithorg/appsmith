import React from "react";
import ConnectSuccessView from "./ConnectSuccessView";
import useMetadata from "git/hooks/useMetadata";
import useConnect from "git/hooks/useConnect";
import useSettings from "git/hooks/useSettings";

function ConnectSuccess() {
  const { toggleConnectSuccessModal } = useConnect();
  const { toggleSettingsModal } = useSettings();

  const { metadata } = useMetadata();

  const remoteUrl = metadata?.remoteUrl ?? null;
  const repoName = metadata?.repoName ?? null;
  const defaultBranch = metadata?.defaultBranchName ?? null;

  return (
    <ConnectSuccessView
      defaultBranch={defaultBranch}
      remoteUrl={remoteUrl}
      repoName={repoName}
      toggleModalOpen={toggleConnectSuccessModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default ConnectSuccess;
