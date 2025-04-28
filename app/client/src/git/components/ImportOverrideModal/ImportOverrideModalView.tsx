import {
  Button,
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
  isImportLoading: boolean;
  isOpen: boolean;
  newArtifactName: string | null;
  oldArtifactName: string | null;
  onImport: () => void;
  onOpenChange: (open: boolean) => void;
}

function ImportOverrideModalView({
  artifactType = "artifact",
  isImportLoading = false,
  isOpen = false,
  newArtifactName = null,
  oldArtifactName = null,
  onImport = noop,
  onOpenChange = noop,
}: ImportOverrideModalViewProps) {
  const modalTitle = useMessage(IMPORT_OVERRIDE_MODAL.TITLE, { artifactType });
  const modalDescription = useMessage(IMPORT_OVERRIDE_MODAL.DESCRIPTION, {
    newArtifactName: newArtifactName ?? "",
    oldArtifactName: oldArtifactName ?? "",
    artifactType,
  });
  const ctaBtnText = useMessage(IMPORT_OVERRIDE_MODAL.OVERRIDE_BTN, {
    artifactType,
  });

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleImport = useCallback(() => {
    if (!isImportLoading) {
      onImport();
    }
  }, [isImportLoading, onImport]);

  return (
    <Modal onOpenChange={onOpenChange} open={isOpen}>
      <StyledModalContent>
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalBody>
          <Text kind="body-m" renderAs="p">
            {modalDescription}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={handleCancel} size="md">
            {IMPORT_OVERRIDE_MODAL.CANCEL_BTN}
          </Button>
          <Button
            isLoading={isImportLoading}
            onClick={handleImport}
            size="md"
            type="submit"
          >
            {ctaBtnText}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default ImportOverrideModalView;
