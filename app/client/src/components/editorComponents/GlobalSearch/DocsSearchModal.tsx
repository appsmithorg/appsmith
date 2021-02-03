import React from "react";
import styled from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";
import Search from "./Search";

const StyledDocsSearchModal = styled.div`
  & {
    .${Classes.OVERLAY} {
      position: fixed;
      top: 48px;
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

const DocsSearchModal = ({
  modalOpen,
  toggleShow,
}: {
  modalOpen: boolean;
  toggleShow: () => void;
}) => (
  <StyledDocsSearchModal>
    <Overlay
      isOpen={modalOpen}
      onClose={toggleShow}
      hasBackdrop={true}
      usePortal={false}
    >
      <div className={Classes.OVERLAY_CONTENT}>
        <Search />
      </div>
    </Overlay>
  </StyledDocsSearchModal>
);

export default DocsSearchModal;
