import React from "react";
import ConnectModalView from "./ConnectModalView";
import { useGitContext } from "../GitContextProvider";
import useConnect from "git/hooks/useConnect";
import useMetadata from "git/hooks/useMetadata";
import useSettings from "git/hooks/useSettings";

interface ConnectModalProps {
  isImport?: boolean;
}

function ConnectModal({ isImport = false }: ConnectModalProps) {
  const { artifactDef, isCreateArtifactPermitted, setImportWorkspaceId } =
    useGitContext();
  const {
    connect,
    connectError,
    fetchSSHKey,
    generateSSHKey,
    gitImport,
    isConnectLoading,
    isConnectModalOpen,
    isFetchSSHKeyLoading,
    isGenerateSSHKeyLoading,
    isGitImportLoading,
    resetFetchSSHKey,
    resetGenerateSSHKey,
    sshKey,
    toggleConnectModal,
  } = useConnect();
  const { isGitConnected, metadata } = useMetadata();
  const { toggleSettingsModal } = useSettings();

  const { artifactType } = artifactDef;
  const sshPublicKey = sshKey?.publicKey ?? null;
  const remoteUrl = metadata?.remoteUrl ?? null;
  const repoName = metadata?.repoName ?? null;
  const defaultBranch = metadata?.defaultBranchName ?? null;

  return (
    <ConnectModalView
      artifactType={artifactType}
      connect={connect}
      connectError={connectError}
      defaultBranch={defaultBranch}
      fetchSSHKey={fetchSSHKey}
      generateSSHKey={generateSSHKey}
      gitImport={gitImport}
      isConnectLoading={isConnectLoading}
      isConnectModalOpen={isConnectModalOpen}
      isCreateArtifactPermitted={isCreateArtifactPermitted}
      isFetchSSHKeyLoading={isFetchSSHKeyLoading}
      isGenerateSSHKeyLoading={isGenerateSSHKeyLoading}
      isGitConnected={isGitConnected}
      isGitImportLoading={isGitImportLoading}
      isImport={isImport}
      remoteUrl={remoteUrl}
      repoName={repoName}
      resetFetchSSHKey={resetFetchSSHKey}
      resetGenerateSSHKey={resetGenerateSSHKey}
      setImportWorkspaceId={setImportWorkspaceId}
      sshPublicKey={sshPublicKey}
      toggleConnectModal={toggleConnectModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default ConnectModal;
