import React, { useState } from "react";
import styled from "styled-components";
import {
  createMessage,
  APPLICATION_IMPORT_SUCCESS,
  APPLICATION_IMPORT_SUCCESS_DESCRIPTION,
} from "ee/constants/messages";
import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import { useSelector } from "react-redux";
import { getIsAiAgentFlowEnabled } from "ee/selectors/aiAgentSelectors";

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const StyledModalContent = styled(ModalContent)`
  width: 640px;
`;

interface ImportSuccessModalProps {
  title?: string;
  description?: string;
}

function ImportSuccessModal(props: ImportSuccessModalProps) {
  const {
    description = createMessage(APPLICATION_IMPORT_SUCCESS_DESCRIPTION),
    title = createMessage(APPLICATION_IMPORT_SUCCESS),
  } = props;
  const importedAppSuccess = localStorage.getItem("importSuccess");
  // const isOpen = importedAppSuccess === "true";
  const [isOpen, setIsOpen] = useState(importedAppSuccess === "true");
  const isAgentFlowEnabled = useSelector(getIsAiAgentFlowEnabled);

  const onClose = (open: boolean) => {
    if (!open) {
      close();
    }
  };

  const close = () => {
    setIsOpen(false);
    localStorage.setItem("importSuccess", "false");
  };

  return (
    <Modal onOpenChange={onClose} open={isOpen && !isAgentFlowEnabled}>
      <StyledModalContent className={"t--import-app-success-modal"}>
        <ModalHeader>Datasource configured</ModalHeader>
        <ModalBody>
          <BodyContainer>
            <Icon
              color="var(--ads-v2-color-fg-success)"
              name="success"
              size={"lg"}
            />
            <Text kind="heading-m">{title}</Text>
            <Text>{description}</Text>
          </BodyContainer>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--import-success-modal-got-it"
            onClick={() => {
              close();
            }}
            size={"md"}
          >
            Got it
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default ImportSuccessModal;
