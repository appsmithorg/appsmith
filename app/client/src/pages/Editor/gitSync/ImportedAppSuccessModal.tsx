import React, { useState } from "react";
import styled from "styled-components";
import {
  createMessage,
  APPLICATION_IMPORT_SUCCESS,
  APPLICATION_IMPORT_SUCCESS_DESCRIPTION,
} from "@appsmith/constants/messages";
import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const StyledModalContent = styled(ModalContent)`
  width: 640px;
`;

function ImportedApplicationSuccessModal() {
  const importedAppSuccess = localStorage.getItem("importApplicationSuccess");
  // const isOpen = importedAppSuccess === "true";
  const [isOpen, setIsOpen] = useState(importedAppSuccess === "true");

  const onClose = (open: boolean) => {
    if (!open) {
      close();
    }
  };

  const close = () => {
    setIsOpen(false);
    localStorage.setItem("importApplicationSuccess", "false");
  };

  return (
    <Modal onOpenChange={onClose} open={isOpen}>
      <StyledModalContent className={"t--import-app-success-modal"}>
        <ModalHeader>Datasource configured</ModalHeader>
        <ModalBody>
          <BodyContainer>
            <Icon
              color="var(--ads-v2-color-fg-success)"
              name="success"
              size={"lg"}
            />
            <Text kind="heading-m">
              {createMessage(APPLICATION_IMPORT_SUCCESS)}
            </Text>
            <Text>{createMessage(APPLICATION_IMPORT_SUCCESS_DESCRIPTION)}</Text>
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

export default ImportedApplicationSuccessModal;
