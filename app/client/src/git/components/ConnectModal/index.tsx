import React, { useCallback } from "react";
import ConnectModalView from "./ConnectModalView";
import { useGitContext } from "../GitContextProvider";
import useConnect from "git/hooks/useConnect";
import { GitArtifactType } from "git/constants/enums";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import useSSHKey from "git/hooks/useSSHKey";
import useImport from "git/hooks/useImport";
import history from "utils/history";

function ConnectModal() {
  const { artifactDef, isConnectPermitted, setImportWorkspaceId } =
    useGitContext();
  const {
    connect,
    connectError,
    isConnectLoading,
    isConnectModalOpen,
    resetConnect,
    toggleConnectModal,
  } = useConnect();
  const { toggleImportModal } = useImport();
  const {
    fetchSSHKey,
    generateSSHKey,
    isFetchSSHKeyLoading,
    isGenerateSSHKeyLoading,
    resetFetchSSHKey,
    resetGenerateSSHKey,
    sshKey,
  } = useSSHKey();

  const artifactType = artifactDef?.artifactType ?? GitArtifactType.Application;
  const sshPublicKey = sshKey?.publicKey ?? null;
  const isSSHKeyLoading = isFetchSSHKeyLoading || isGenerateSSHKeyLoading;

  const onSubmit = useCallback(
    (params: ConnectRequestParams) => {
      AnalyticsUtil.logEvent("GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK", {
        repoUrl: params?.remoteUrl,
        connectFlow: "v2",
      });
      connect(params);
    },
    [connect],
  );

  const onOpenImport = useCallback(() => {
    toggleConnectModal(false);
    history.push("/applications");
    setImportWorkspaceId();
    toggleImportModal(true);
    AnalyticsUtil.logEvent("GS_IMPORT_VIA_GIT_DURING_GC");
  }, [setImportWorkspaceId, toggleConnectModal, toggleImportModal]);

  const resetConnectState = useCallback(() => {
    resetConnect();
    resetFetchSSHKey();
    resetGenerateSSHKey();
  }, [resetConnect, resetFetchSSHKey, resetGenerateSSHKey]);

  return (
    <ConnectModalView
      artifactType={artifactType}
      error={connectError}
      isImport={false}
      isModalOpen={isConnectModalOpen}
      isSSHKeyLoading={isSSHKeyLoading}
      isSubmitLoading={isConnectLoading}
      onFetchSSHKey={fetchSSHKey}
      onGenerateSSHKey={generateSSHKey}
      onOpenImport={isConnectPermitted ? onOpenImport : null}
      onSubmit={onSubmit}
      resetConnectState={resetConnectState}
      sshPublicKey={sshPublicKey}
      toggleModalOpen={toggleConnectModal}
    />
  );
}

export default ConnectModal;
