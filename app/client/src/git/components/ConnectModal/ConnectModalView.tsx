import { Modal, ModalContent } from "@appsmith/ads";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";
import type { GitApiError } from "git/store/types";
import React, { useCallback } from "react";
import ConnectInitialize from "./ConnectInitialize";
import ConnectSuccess from "./ConnectSuccess";
import { noop } from "lodash";
import type { GitSettingsTab } from "git/constants/enums";
import styled from "styled-components";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 640px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 320px);
    max-height: calc(100vh - 200px);
  }
`;

interface ConnectModalViewProps {
  artifactType: string;
  connect: (params: ConnectRequestParams) => void;
  connectError: GitApiError | null;
  fetchSSHKey: () => void;
  generateSSHKey: (keyType: string) => void;
  gitImport: (params: GitImportRequestParams) => void;
  isConnectLoading: boolean;
  isConnectModalOpen: boolean;
  isFetchSSHKeyLoading: boolean;
  isGenerateSSHKeyLoading: boolean;
  isGitImportLoading: boolean;
  isImport: boolean;
  resetFetchSSHKey: () => void;
  resetGenerateSSHKey: () => void;
  sshPublicKey: string | null;
  toggleConnectModal: (open: boolean) => void;
  isGitConnected: boolean;
  remoteUrl: string | null;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
  defaultBranch: string | null;
  repoName: string | null;
  setImportWorkspaceId: () => void;
  isCreateArtifactPermitted: boolean;
}

function ConnectModalView({
  defaultBranch = null,
  isConnectModalOpen = false,
  isGitConnected = false,
  remoteUrl = null,
  repoName = null,
  resetFetchSSHKey = noop,
  resetGenerateSSHKey = noop,
  toggleConnectModal = noop,
  toggleSettingsModal = noop,
  ...rest
}: ConnectModalViewProps) {
  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetFetchSSHKey();
        resetGenerateSSHKey();
      }

      toggleConnectModal(open);
    },
    [resetFetchSSHKey, resetGenerateSSHKey, toggleConnectModal],
  );

  return (
    <Modal onOpenChange={handleModalOpenChange} open={isConnectModalOpen}>
      <StyledModalContent data-testid="t--git-connect-modal">
        {isConnectModalOpen ? (
          // need fragment to arrange conditions properly
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            {isGitConnected ? (
              <ConnectSuccess
                defaultBranch={defaultBranch}
                remoteUrl={remoteUrl}
                repoName={repoName}
                toggleConnectModal={toggleConnectModal}
                toggleSettingsModal={toggleSettingsModal}
              />
            ) : (
              <ConnectInitialize
                toggleConnectModal={toggleConnectModal}
                {...rest}
              />
            )}
          </>
        ) : null}
      </StyledModalContent>
    </Modal>
  );
}

export default ConnectModalView;
