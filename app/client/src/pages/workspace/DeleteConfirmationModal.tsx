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
  userToBeDeleted: {
    name: string;
    username: string;
    workspaceId: string;
    userGroupId?: string;
    entityId?: string;
    entityType?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeletingUser: boolean;
};

function DeleteConfirmationModal(props: DeleteConfirmationProps) {
  const { isDeletingUser, isOpen, onClose, onConfirm, userToBeDeleted } = props;
  const { entityType, name, username } = userToBeDeleted;

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Modal onOpenChange={onOpenChange} open={isOpen}>
      <ModalContent className={"t--member-delete-confirmation-modal"}>
        <ModalHeader>{DELETE_CONFIRMATION_MODAL_TITLE()}</ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            {DELETE_CONFIRMATION_MODAL_SUBTITLE(name || username, entityType)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button
            isLoading={isDeletingUser}
            kind="error"
            onClick={onConfirm}
            size="md"
          >
            Remove
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeleteConfirmationModal;
