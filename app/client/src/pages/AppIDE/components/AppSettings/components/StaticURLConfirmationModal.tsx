import React from "react";
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
import styled from "styled-components";
import UrlPreview from "./UrlPreview";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 600px;
    max-height: calc(100vh - 100px);
  }
`;

const WarningContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: var(--ads-v2-color-bg-warning);
  border-radius: var(--ads-v2-border-radius);
  margin-bottom: 16px;
  align-items: flex-start;
`;

const StyledWarningIcon = styled(Icon)`
  color: var(--ads-v2-color-fg-warning);
  flex-shrink: 0;
`;

const UrlSection = styled.div`
  margin-bottom: 16px;
`;

const UrlLabel = styled(Text)`
  margin-bottom: 8px;
  display: block;
`;

const UrlHighlight = styled.span`
  font-weight: 600;
  color: var(--ads-v2-color-fg-emphasis);
`;

interface StaticURLConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  baseUrl: string;
  oldSlug?: string;
  newSlug?: string;
  isSaving: boolean;
  isDisabling?: boolean;
}

function StaticURLConfirmationModal({
  baseUrl,
  isDisabling = false,
  isOpen,
  isSaving,
  newSlug,
  oldSlug,
  onClose,
  onConfirm,
}: StaticURLConfirmationModalProps) {
  return (
    <Modal onOpenChange={onClose} open={isOpen}>
      <StyledModalContent data-testid="t--static-url-confirmation-modal">
        <ModalHeader>
          {isDisabling ? "Disable App Static URL" : "Change App Slug"}
        </ModalHeader>
        <ModalBody>
          <WarningContainer>
            <StyledWarningIcon name="alert-line" size="md" />
            <Text kind="body-m">
              {isDisabling
                ? "Disabling Static URL will revert this app to its default Appsmith URLs. These URLs are automatically generated from the app its pages names and identifiers."
                : "Changing the app slug affects every page and deployed version of this app. The change applies right away and may break existing links."}
            </Text>
          </WarningContainer>

          <UrlSection>
            <UrlLabel kind="body-m">From</UrlLabel>
            <UrlPreview>
              {baseUrl}
              {oldSlug && <UrlHighlight>{oldSlug}</UrlHighlight>}
            </UrlPreview>
          </UrlSection>

          <UrlSection>
            <UrlLabel kind="body-m">To</UrlLabel>
            <UrlPreview>
              {baseUrl}
              {newSlug && <UrlHighlight>{newSlug}</UrlHighlight>}
            </UrlPreview>
          </UrlSection>

          <Text kind="body-m">Are you sure you want to continue?</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            data-testid="t--static-url-confirmation-cancel"
            kind="secondary"
            onClick={onClose}
            size="md"
          >
            Cancel
          </Button>
          <Button
            data-testid="t--static-url-confirmation-confirm"
            isLoading={isSaving}
            kind="primary"
            onClick={onConfirm}
            size="md"
          >
            {isDisabling ? "Disable Static URL" : "Change App Slug"}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default StaticURLConfirmationModal;
