import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import React from "react";
import CommunityTemplateForm from "./CommunityTemplateForm";
import { PublishPageHeaderContainer } from "./StyledComponents";

interface Props {
  onPublishSuccess: () => void;
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
}

const PublishCommunityTemplateModal = ({
  onPublishSuccess,
  setShowModal,
  showModal,
}: Props) => {
  const handlePublishSuccess = () => {
    onPublishSuccess();
  };

  return (
    <Modal onOpenChange={() => setShowModal(false)} open={showModal}>
      <ModalContent style={{ padding: 0, width: "80%", maxWidth: "1000px" }}>
        <PublishPageHeaderContainer>
          <ModalHeader>
            <Text className="title" kind="heading-xl">
              {createMessage(COMMUNITY_TEMPLATES.publishFormPage.title)}
            </Text>
          </ModalHeader>
        </PublishPageHeaderContainer>
        <ModalBody>
          <CommunityTemplateForm onPublishSuccess={handlePublishSuccess} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PublishCommunityTemplateModal;
