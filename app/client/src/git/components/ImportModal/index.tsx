import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import ConnectModalView from "../ConnectModal/ConnectModalView";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";
import useImport from "git/hooks/useImport";
import useGlobalSSHKey from "git/hooks/useGlobalSSHKey";
import { useGitContext } from "../GitContextProvider";
import { getCurrentUser } from "selectors/usersSelectors";
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

  const {
    fetchSSHKeys,
    isSSHKeyManagerEnabled,
    isSSHKeysLoading,
    onCreateSSHKey: onCreateSSHKeyNav,
    sshKeys,
  } = useGitContext();

  const currentUser = useSelector(getCurrentUser);

  const sshPublicKey = globalSSHKey?.publicKey ?? null;

  const onSubmit = useCallback(
    (params: GitImportRequestParams) => {
      gitImport({ ...params, override: false });
    },
    [gitImport],
  );

  const handleCreateSSHKey = useCallback(() => {
    toggleImportModal(false);
    onCreateSSHKeyNav();
  }, [toggleImportModal, onCreateSSHKeyNav]);

  const resetConnectState = useCallback(() => {
    resetGlobalSSHKey();
    resetGitImport();
  }, [resetGitImport, resetGlobalSSHKey]);

  return (
    <ConnectModalView
      artifactType="artifact"
      availableSSHKeys={sshKeys ?? []}
      currentUserEmail={currentUser?.email}
      error={gitImportError}
      isImport
      isModalOpen={isImportModalOpen}
      isSSHKeyLoading={isFetchGlobalSSHKeyLoading}
      isSSHKeyManagerEnabled={isSSHKeyManagerEnabled}
      isSSHKeysLoading={isSSHKeysLoading}
      isSubmitLoading={isGitImportLoading}
      onCreateSSHKey={handleCreateSSHKey}
      onFetchSSHKey={noop}
      onFetchSSHKeys={fetchSSHKeys}
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
