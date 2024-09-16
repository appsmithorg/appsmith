import React from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { ModalBody, ModalContent, Modal } from "@appsmith/ads";

const StyledDocsSearchModal = styled(ModalContent)`
  text-rendering: auto;
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;
  width: 500px;
  margin-left: -250px;
  margin-top: -200px;
  transform: translate3d(0, 0, 0) !important;
  &.modal-documentation,
  &.modal-snippet {
    width: 786px;
    will-change: transform;
    margin-left: -393px;
  }
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

interface Props {
  modalOpen: boolean;
  toggleShow: () => void;
  children: React.ReactNode;
  className?: string;
}

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
      <StyledDocsSearchModal
        className={`${className}`}
        data-testid="t--global-search-modal"
      >
        {/* @ts-expect-error Figure out how to pass string to constant className */}
        <ModalBody className={`${className}`}>{children}</ModalBody>
      </StyledDocsSearchModal>
    </Modal>
  );
}

export default DocsSearchModal;
