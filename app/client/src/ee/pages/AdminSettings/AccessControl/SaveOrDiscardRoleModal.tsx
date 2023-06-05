import React from "react";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "@appsmith/constants/messages";
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Text,
} from "design-system";

interface SaveOrDiscardModalProps {
  isOpen: boolean;
  onChangeModal(val: boolean): void;
  onDiscard(): void;
  onSave?(): void;
  disabledButtons: boolean;
}

function SaveOrDiscardRoleModal(props: SaveOrDiscardModalProps) {
  const { disabledButtons, isOpen, onChangeModal, onDiscard, onSave } = props;

  const disableSaveButton = disabledButtons;

  return (
    <Modal onOpenChange={(open: boolean) => onChangeModal(open)} open={isOpen}>
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </ModalHeader>
        <ModalBody>
          <Text renderAs="p">
            Unsaved changes will be lost if you switch tab, save the changes
            before exiting.
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button
            className="t--role-modal-do-not-save"
            kind="secondary"
            onClick={onDiscard}
            size="md"
          >
            {"Don't save"}
          </Button>
          <Button
            className="t--role-modal-save"
            isDisabled={disableSaveButton}
            onClick={onSave}
            size="md"
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SaveOrDiscardRoleModal;
