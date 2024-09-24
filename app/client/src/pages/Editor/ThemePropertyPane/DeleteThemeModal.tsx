import React from "react";

import {
  createMessage,
  DELETE_APP_THEME_WARNING,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "ee/constants/messages";
import {
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Text,
  ModalBody,
} from "@appsmith/ads";

interface DeleteThemeModalProps {
  isOpen: boolean;
  onClose(): void;
  onDelete(): void;
}

function DeleteThemeModal(props: DeleteThemeModalProps) {
  const { isOpen, onClose, onDelete } = props;

  return (
    <Modal
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <ModalContent
        id="delete-theme-modal"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        style={{ width: "640px" }}
      >
        <ModalHeader>
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </ModalHeader>
        <ModalBody>
          <Text kind="action-l">{createMessage(DELETE_APP_THEME_WARNING)}</Text>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-3">
            <Button kind="secondary" onClick={onClose} size="md">
              No
            </Button>
            <Button kind="error" onClick={onDelete} size="md">
              Delete
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeleteThemeModal;
