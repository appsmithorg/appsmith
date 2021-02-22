import React from "react";
import styled from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";

const StyledDocsSearchModal = styled.div`
  & {
    .${Classes.OVERLAY} {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      .${Classes.OVERLAY_CONTENT} {
        overflow: hidden;
        position: relative;
        top: 10vh;
      }
    }
  }
`;

type Props = {
  modalOpen: boolean;
  toggleShow: () => void;
  children: React.ReactNode;
};

const DocsSearchModal = ({ modalOpen, toggleShow, children }: Props) => (
  <StyledDocsSearchModal>
    <Overlay
      isOpen={modalOpen}
      onClose={toggleShow}
      hasBackdrop={true}
      usePortal={false}
    >
      <div className={Classes.OVERLAY_CONTENT}>{children}</div>
    </Overlay>
  </StyledDocsSearchModal>
);

export default DocsSearchModal;
