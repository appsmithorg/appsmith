import {
  Button,
  Callout,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

const StyledModalContent = styled(ModalContent)`
  width: 640px;
`;

interface ImportOverrideModalProps {
  artifactType?: string;
}

function ImportOverrideModal({
  artifactType = "artifact",
}: ImportOverrideModalProps) {
  return (
    <Modal open>
      <StyledModalContent>
        <ModalHeader>Override existing {artifactType}?</ModalHeader>
        <ModalBody>
          <Callout kind="warning">
            <Text>
              You&apos;re trying to import a {artifactType} that already exists
              in this workspace as <b>my-app</b>. Do you want to override it?
            </Text>
          </Callout>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" size="md">
            Cancel
          </Button>
          <Button size="md">Import and override {artifactType}</Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default ImportOverrideModal;
