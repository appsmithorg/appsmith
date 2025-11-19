import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Text,
} from "@appsmith/ads";
import {
  createMessage,
  DISABLE_PREPARED_STATEMENT_CONFIRMATION_HEADING,
  DISABLE_PREPARED_STATEMENT_CONFIRMATION_DESCRIPTION,
} from "ce/constants/messages";

interface DisablePreparedStatementConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DisablePreparedStatementConfirmationModal(
  props: DisablePreparedStatementConfirmationProps,
) {
  const { isOpen, onCancel, onConfirm } = props;

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    }
  };

  return (
    <Modal onOpenChange={onOpenChange} open={isOpen}>
      <ModalContent
        className={"t--disable-prepared-statement-confirmation-modal"}
        style={{ width: "600px" }}
      >
        <ModalHeader>
          {createMessage(DISABLE_PREPARED_STATEMENT_CONFIRMATION_HEADING)}
        </ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            {createMessage(DISABLE_PREPARED_STATEMENT_CONFIRMATION_DESCRIPTION)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={onCancel} size="md">
            Cancel
          </Button>
          <Button
            data-testid="t--disable-prepared-statement-confirm-button"
            kind="error"
            onClick={onConfirm}
            size="md"
          >
            Disable anyway
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DisablePreparedStatementConfirmationModal;

