import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Text,
} from "design-system";
import {
  DELETE_CONFIRMATION_MODAL_TITLE,
  DELETE_CONFIRMATION_MODAL_SUBTITLE,
} from "@appsmith/constants/messages";

type DeleteConfirmationProps = {
  username?: string | null;
  name?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeletingUser: boolean;
};

function DeleteConfirmationModal(props: DeleteConfirmationProps) {
  const { isDeletingUser, isOpen, name, onClose, onConfirm, username } = props;

  return (
    <Modal open={isOpen}>
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {DELETE_CONFIRMATION_MODAL_TITLE()}
        </ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            {DELETE_CONFIRMATION_MODAL_SUBTITLE(name || username)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            isLoading={isDeletingUser}
            kind="error"
            onClick={onConfirm}
            size="md"
          >
            Remove
          </Button>
          <Button kind="secondary" onClick={onClose} size="md">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeleteConfirmationModal;
