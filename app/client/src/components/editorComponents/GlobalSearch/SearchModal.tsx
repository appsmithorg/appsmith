import React from "react";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ModalBody, ModalContent, Modal } from "design-system";

const StyledDocsSearchModal = styled(ModalContent)`
  .modal-snippet,
  .modal-documentation {
    overflow: hidden;
    .container {
      overflow: auto;
    }
    .main {
      overflow: hidden;
    }
  }
`;

type Props = {
  modalOpen: boolean;
  toggleShow: () => void;
  children: React.ReactNode;
  className?: string;
};

function DocsSearchModal({
  children,
  className,
  modalOpen,
  toggleShow,
}: Props) {
  return (
    <Modal
      onOpenChange={() => {
        toggleShow();
        AnalyticsUtil.logEvent("CLOSE_OMNIBAR");
      }}
      open={modalOpen}
    >
      <StyledDocsSearchModal data-testid="t--global-search-modal">
        <ModalBody className={`${className}`}>{children}</ModalBody>
      </StyledDocsSearchModal>
    </Modal>
  );
}

export default DocsSearchModal;
