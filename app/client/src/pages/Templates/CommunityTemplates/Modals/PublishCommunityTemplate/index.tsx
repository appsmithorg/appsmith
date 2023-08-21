import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "design-system";
import React from "react";
import CommunityTempaltePublishSuccess from "./CommunityTempaltePublishSuccess";
import CommunityTemplateForm from "./CommunityTemplateForm";
import { PublishPageHeaderContainer } from "./StyledComponents";

type Props = {
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
};

const PublishCommunityTemplateModal = ({ setShowModal, showModal }: Props) => {
  const isAppPublished = false;
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
          {isAppPublished ? (
            <CommunityTempaltePublishSuccess />
          ) : (
            <CommunityTemplateForm />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PublishCommunityTemplateModal;
