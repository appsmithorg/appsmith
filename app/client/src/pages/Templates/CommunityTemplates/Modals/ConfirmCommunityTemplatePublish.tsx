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
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  templateName: string;
};

const ConfirmCommunityTemplatePublish = ({
  setShowModal,
  showModal,
  templateName,
}: Props) => {
  return (
    <Modal onOpenChange={(isOpen) => setShowModal(isOpen)} open={showModal}>
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>
          {createMessage(COMMUNITY_TEMPLATES.confirmModal.title, templateName)}
        </ModalHeader>
        <ModalBody>
          {createMessage(COMMUNITY_TEMPLATES.confirmModal.description)}
        </ModalBody>
        <ModalFooter>
          <Button
            kind="secondary"
            onClick={() => setShowModal(false)}
            size="md"
            type="button"
          >
            {createMessage(COMMUNITY_TEMPLATES.cancel)}
          </Button>
          <Button size="md">
            {createMessage(COMMUNITY_TEMPLATES.publish)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmCommunityTemplatePublish;
