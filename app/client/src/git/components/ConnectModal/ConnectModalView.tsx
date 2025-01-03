import { Modal, ModalContent } from "@appsmith/ads";
import React, { useCallback } from "react";
import ConnectInitialize, {
  type ConnectInitializeProps,
} from "./ConnectInitialize";
import { noop } from "lodash";
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

interface ConnectModalViewProps extends ConnectInitializeProps {
  isModalOpen: boolean;
  resetSSHKey: () => void;
  toggleModalOpen: (open: boolean) => void;
}

function ConnectModalView({
  isModalOpen = false,
  resetSSHKey = noop,
  toggleModalOpen = noop,
  ...rest
}: ConnectModalViewProps) {
  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetSSHKey();
      }

      toggleModalOpen(open);
    },
    [resetSSHKey, toggleModalOpen],
  );

  return (
    <Modal onOpenChange={handleModalOpenChange} open={isModalOpen}>
      <StyledModalContent data-testid="t--git-connect-modal">
        {isModalOpen ? <ConnectInitialize {...rest} /> : null}
      </StyledModalContent>
    </Modal>
  );
}

export default ConnectModalView;
