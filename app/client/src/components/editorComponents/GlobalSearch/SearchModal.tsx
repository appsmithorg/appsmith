import React from "react";
import styled from "styled-components";
// import { Overlay, Classes } from "@blueprintjs/core";
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
      data-testid="t--global-search-modal"
      onOpenChange={() => {
        toggleShow();
        AnalyticsUtil.logEvent("CLOSE_OMNIBAR");
      }}
      open={modalOpen}
    >
      <StyledDocsSearchModal>
        <ModalBody className={`${className}`}>{children}</ModalBody>
      </StyledDocsSearchModal>
    </Modal>
  );
}

export default DocsSearchModal;
