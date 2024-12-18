import {
  AUTOCOMMIT_CONFIRM_DISABLE_MESSAGE,
  AUTOCOMMIT_DISABLE,
  createMessage,
} from "ee/constants/messages";
import {
  Button,
  Callout,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import React, { useCallback } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import noop from "lodash/noop";
import styled from "styled-components";

const StyledModalContent = styled(ModalContent)`
  width: 640px;
`;

const StyledModalHeader = styled(ModalHeader)`
  margin: 0;
`;

interface DisableAutocommitModalViewProps {
  isAutocommitDisableModalOpen?: boolean;
  isToggleAutocommitLoading?: boolean;
  toggleAutocommit?: () => void;
  toggleAutocommitDisableModal?: (open: boolean) => void;
}

function DisableAutocommitModalView({
  isAutocommitDisableModalOpen = false,
  isToggleAutocommitLoading = false,
  toggleAutocommit = noop,
  toggleAutocommitDisableModal = noop,
}: DisableAutocommitModalViewProps) {
  const handleDisableAutocommit = useCallback(() => {
    toggleAutocommit();
    AnalyticsUtil.logEvent("GS_AUTO_COMMIT_DISABLED");
    toggleAutocommitDisableModal(false);
  }, [toggleAutocommit, toggleAutocommitDisableModal]);

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) toggleAutocommitDisableModal(false);
    },
    [toggleAutocommitDisableModal],
  );

  return (
    <Modal
      onOpenChange={handleModalOpenChange}
      open={isAutocommitDisableModalOpen}
    >
      <StyledModalContent data-testid="t--autocommit-git-modal">
        <StyledModalHeader>
          {createMessage(AUTOCOMMIT_DISABLE)}
        </StyledModalHeader>
        <ModalBody>
          <Callout kind="warning">
            <Text>{createMessage(AUTOCOMMIT_CONFIRM_DISABLE_MESSAGE)}</Text>
          </Callout>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--autocommit-modal-cta-button"
            isLoading={isToggleAutocommitLoading}
            kind="primary"
            onClick={handleDisableAutocommit}
            size="md"
          >
            {createMessage(AUTOCOMMIT_DISABLE)}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default DisableAutocommitModalView;
