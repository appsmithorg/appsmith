import React from "react";
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@appsmith/ads";
import {
  GENERATE_DEPLOY_KEY_MODAL_TITLE,
  GENERATE_DEPLOY_KEY_MODAL_WAIT_TEXT,
  createMessage,
} from "ee/constants/messages";
import { StyledModalContent } from "git/components/common/GitUIComponents";
import styled from "styled-components";
import AddDeployKey from "git/components/common/AddDeployKey";
import type { ConnectFormDataState } from "git/components/common/types";
import type { GitApiError } from "git/store/types";
import Statusbar from "../Statusbar";

interface GenerateDeployKeyModalViewProps {
  error: GitApiError | null;
  formData: ConnectFormDataState;
  isModalOpen: boolean;
  isSSHKeyLoading: boolean;
  onChange: (args: Partial<ConnectFormDataState>) => void;
  onFetchSSHKey: () => void;
  onGenerateSSHKey: (keyType: string) => void;
  onModalOpenChange: (open: boolean) => void;
  sshPublicKey: string | null;
  onUpdateGeneratedSSHKey: () => void;
  isUpdateGeneratedSSHKeyLoading: boolean;
}

const OFFSET = 200;
const OUTER_PADDING = 32;
const FOOTER = 56;
const HEADER = 44;

const StyledModalBody = styled(ModalBody)`
  flex: 1;
  overflow-y: initial;
  display: flex;
  flex-direction: column;
  max-height: calc(
    100vh - ${OFFSET}px - ${OUTER_PADDING}px - ${FOOTER}px - ${HEADER}px
  );
`;

function GenerateDeployKeyModalView({
  error,
  formData,
  isModalOpen,
  isSSHKeyLoading,
  isUpdateGeneratedSSHKeyLoading,
  onChange,
  onFetchSSHKey,
  onGenerateSSHKey,
  onModalOpenChange,
  onUpdateGeneratedSSHKey,
  sshPublicKey,
}: GenerateDeployKeyModalViewProps) {
  const isSubmitLoading = false; // This modal doesn't have submit functionality

  return (
    <Modal onOpenChange={onModalOpenChange} open={isModalOpen}>
      <StyledModalContent>
        <ModalHeader>
          {createMessage(GENERATE_DEPLOY_KEY_MODAL_TITLE)}
        </ModalHeader>
        <StyledModalBody>
          <AddDeployKey
            error={error}
            isSSHKeyLoading={isSSHKeyLoading}
            isSubmitLoading={isSubmitLoading}
            onChange={onChange}
            onFetchSSHKey={onFetchSSHKey}
            onGenerateSSHKey={onGenerateSSHKey}
            sshPublicKey={sshPublicKey}
            value={formData}
          />
        </StyledModalBody>
        <ModalFooter>
          <Flex
            alignItems="center"
            flex={1}
            flexDirection="row-reverse"
            justifyContent="space-between"
          >
            <Button
              data-testid="t--git-generate-deploy-key-finish-btn"
              isDisabled={!formData.isAddedDeployKey}
              isLoading={isUpdateGeneratedSSHKeyLoading}
              onClick={onUpdateGeneratedSSHKey}
              size="md"
            >
              Finish
            </Button>
            {isUpdateGeneratedSSHKeyLoading && (
              <Statusbar
                completed={!isUpdateGeneratedSSHKeyLoading}
                message={createMessage(GENERATE_DEPLOY_KEY_MODAL_WAIT_TEXT)}
              />
            )}
          </Flex>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default GenerateDeployKeyModalView;
