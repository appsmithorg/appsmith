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
import { IMPORT_OVERRIDE_MODAL } from "git/ee/constants/messages";
import useMessage from "git/hooks/useMessage";
import noop from "lodash/noop";
import React, { useCallback } from "react";
import styled from "styled-components";

const StyledModalContent = styled(ModalContent)`
  width: 640px;
`;

interface ImportOverrideModalViewProps {
  artifactType?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
}

function ImportOverrideModalView({
  artifactType = "artifact",
  isOpen = false,
  onImport = noop,
  onOpenChange = noop,
}: ImportOverrideModalViewProps) {
  const modalTitle = useMessage(IMPORT_OVERRIDE_MODAL.TITLE, { artifactType });
  const modalDescription = useMessage(IMPORT_OVERRIDE_MODAL.DESCRIPTION, {
    artifactType,
  });
  const ctaBtnText = useMessage(IMPORT_OVERRIDE_MODAL.OVERRIDE_BTN, {
    artifactType,
  });

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleImport = useCallback(() => {
    onImport();
  }, [onImport]);

  return (
    <Modal onOpenChange={onOpenChange} open={isOpen}>
      <StyledModalContent>
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalBody>
          <Callout kind="warning">
            <Text>{modalDescription}</Text>
          </Callout>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={handleCancel} size="md">
            {IMPORT_OVERRIDE_MODAL.CANCEL_BTN}
          </Button>
          <Button onClick={handleImport} size="md">
            {ctaBtnText}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default ImportOverrideModalView;
