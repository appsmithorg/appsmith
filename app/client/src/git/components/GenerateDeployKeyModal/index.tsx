import React, { useCallback, useEffect, useState } from "react";
import GenerateDeployKeyModalView from "./GenerateDeployKeyModalView";
import useGenerateDeployKey from "git/hooks/useGenerateDeployKey";
import type {
  ConnectFormDataState,
  GitProvider,
} from "git/components/common/types";
import { noop } from "lodash";
import useGlobalSSHKey from "git/hooks/useGlobalSSHKey";
import useMetadata from "git/hooks/useMetadata";
import type { GitMetadata } from "reducers/uiReducers/gitSyncReducer";

const INITIAL_FORM_DATA: ConnectFormDataState = {
  isAddedDeployKey: false,
};

const getGitProviderFromRemoteUrl = (
  remoteUrl: string | undefined,
): GitProvider | undefined => {
  if (!remoteUrl) {
    return undefined;
  }

  if (remoteUrl.includes("github.com")) {
    return "github";
  }

  if (remoteUrl.includes("gitlab.com")) {
    return "gitlab";
  }

  if (remoteUrl.includes("bitbucket.org")) {
    return "bitbucket";
  }

  return undefined;
};

const getInitialFormData = (metadata: GitMetadata): ConnectFormDataState => {
  const remoteUrl = metadata?.remoteUrl;

  return {
    ...INITIAL_FORM_DATA,
    remoteUrl,
    gitProvider: getGitProviderFromRemoteUrl(remoteUrl),
  };
};

function GenerateDeployKeyModal() {
  const {
    isGenerateSSHKeyModalOpen,
    isUpdateGeneratedSSHKeyLoading,
    resetUpdateGeneratedSSHKey,
    toggleGenerateSSHKeyModal,
    updateGeneratedSSHKey,
    updateGeneratedSSHKeyError,
  } = useGenerateDeployKey();

  const {
    fetchGlobalSSHKey,
    globalSSHKey,
    isFetchGlobalSSHKeyLoading,
    resetGlobalSSHKey,
  } = useGlobalSSHKey();

  const { metadata } = useMetadata();

  const [formData, setFormData] = useState<ConnectFormDataState>(() =>
    getInitialFormData(metadata),
  );

  const sshPublicKey = globalSSHKey?.publicKey ?? null;

  useEffect(
    function resetFormDataWhenModalClosesEffect() {
      if (!isGenerateSSHKeyModalOpen) {
        setFormData(getInitialFormData(metadata));
      }
    },
    [isGenerateSSHKeyModalOpen, metadata],
  );

  const handleChange = useCallback(
    (partialFormData: Partial<ConnectFormDataState>) => {
      setFormData((prev) => ({ ...prev, ...partialFormData }));
    },
    [setFormData],
  );

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetGlobalSSHKey();
        resetUpdateGeneratedSSHKey();
        toggleGenerateSSHKeyModal(false);
      } else {
        toggleGenerateSSHKeyModal(true);
      }
    },
    [resetGlobalSSHKey, resetUpdateGeneratedSSHKey, toggleGenerateSSHKeyModal],
  );

  return (
    <GenerateDeployKeyModalView
      error={updateGeneratedSSHKeyError}
      formData={formData}
      isModalOpen={isGenerateSSHKeyModalOpen}
      isSSHKeyLoading={isFetchGlobalSSHKeyLoading}
      isUpdateGeneratedSSHKeyLoading={isUpdateGeneratedSSHKeyLoading}
      onChange={handleChange}
      onFetchSSHKey={noop}
      onGenerateSSHKey={fetchGlobalSSHKey}
      onModalOpenChange={handleModalOpenChange}
      onUpdateGeneratedSSHKey={updateGeneratedSSHKey}
      sshPublicKey={sshPublicKey}
    />
  );
}

export default GenerateDeployKeyModal;
