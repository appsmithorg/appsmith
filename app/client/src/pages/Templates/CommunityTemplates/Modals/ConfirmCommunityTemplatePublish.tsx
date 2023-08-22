import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "design-system";
import React from "react";

type Props = {
  onCancelClick: () => void;
  onConfirmClick: () => void;
  showModal: boolean;
  templateName: string;
};

const ConfirmCommunityTemplatePublish = ({
  onCancelClick,
  onConfirmClick,
  showModal,
  templateName,
}: Props) => {
  return (
    <Modal onOpenChange={() => onCancelClick()} open={showModal}>
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>
          {createMessage(
            COMMUNITY_TEMPLATES.modals.confirmModal.title,
            templateName,
          )}
        </ModalHeader>
        <ModalBody>
          {createMessage(COMMUNITY_TEMPLATES.modals.confirmModal.description)}
        </ModalBody>
        <ModalFooter>
          <Button
            kind="secondary"
            onClick={onCancelClick}
            size="md"
            type="button"
          >
            {createMessage(COMMUNITY_TEMPLATES.cancel)}
          </Button>
          <Button onClick={onConfirmClick} size="md">
            {createMessage(COMMUNITY_TEMPLATES.publish)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmCommunityTemplatePublish;
