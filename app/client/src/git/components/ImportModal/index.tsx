import React, { useCallback } from "react";
import ConnectModalView from "../ConnectModal/ConnectModalView";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";
import useImport from "git/hooks/useImport";
import useGlobalSSHKey from "git/hooks/useGlobalSSHKey";
import noop from "lodash/noop";

function ImportModal() {
  const {
    gitImport,
    gitImportError,
    isGitImportLoading,
    isImportModalOpen,
    resetGitImport,
    toggleImportModal,
  } = useImport();
  const {
    fetchGlobalSSHKey,
    globalSSHKey,
    isFetchGlobalSSHKeyLoading,
    resetGlobalSSHKey,
  } = useGlobalSSHKey();

  const sshPublicKey = globalSSHKey?.publicKey ?? null;

  const onSubmit = useCallback(
    (params: GitImportRequestParams) => {
      gitImport({ ...params, override: false });
    },
    [gitImport],
  );

  const resetConnectState = useCallback(() => {
    resetGlobalSSHKey();
    resetGitImport();
  }, [resetGitImport, resetGlobalSSHKey]);

  return (
    <ConnectModalView
      artifactType="artifact"
      error={gitImportError}
      isImport
      isModalOpen={isImportModalOpen}
      isSSHKeyLoading={isFetchGlobalSSHKeyLoading}
      isSubmitLoading={isGitImportLoading}
      onFetchSSHKey={noop}
      onGenerateSSHKey={fetchGlobalSSHKey}
      onOpenImport={null}
      onSubmit={onSubmit}
      resetConnectState={resetConnectState}
      sshPublicKey={sshPublicKey}
      toggleModalOpen={toggleImportModal}
    />
  );
}

export default ImportModal;
