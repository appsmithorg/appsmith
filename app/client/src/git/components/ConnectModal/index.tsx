import React from "react";
import ConnectModalView from "./ConnectModalView";
import { useGitContext } from "../GitContextProvider";
import useConnect from "git/hooks/useConnect";

interface ConnectModalProps {
  isImport?: boolean;
}

function ConnectModal({ isImport = false }: ConnectModalProps) {
  const { artifactDef } = useGitContext();
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
    sshKey,
    togglleConnectModal,
  } = useConnect();

  const { artifactType } = artifactDef;
  const sshPublicKey = sshKey?.publicKey ?? null;

  return (
    <ConnectModalView
      artifactType={artifactType}
      connect={connect}
      connectError={connectError}
      fetchSSHKey={fetchSSHKey}
      generateSSHKey={generateSSHKey}
      gitImport={gitImport}
      isConnectLoading={isConnectLoading}
      isConnectModalOpen={isConnectModalOpen}
      isFetchSSHKeyLoading={isFetchSSHKeyLoading}
      isGenerateSSHKeyLoading={isGenerateSSHKeyLoading}
      isGitImportLoading={isGitImportLoading}
      isImport={isImport}
      sshPublicKey={sshPublicKey}
      toggleConnectModal={togglleConnectModal}
    />
  );
}

export default ConnectModal;
