import React from "react";
import styled from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
        top: 8vh;
        box-shadow: 0px 6px 20px 0px #00000026;
      }
      .${Classes.OVERLAY_BACKDROP} {
        background: transparent;
      }
    }
  }
`;

type Props = {
  modalOpen: boolean;
  toggleShow: () => void;
  children: React.ReactNode;
};

function DocsSearchModal({ children, modalOpen, toggleShow }: Props) {
  return (
    <StyledDocsSearchModal>
      <Overlay
        hasBackdrop
        isOpen={modalOpen}
        onClose={toggleShow}
        onClosing={() => {
          AnalyticsUtil.logEvent("CLOSE_OMNIBAR");
        }}
        transitionDuration={25}
        usePortal={false}
      >
        <div className={`${Classes.OVERLAY_CONTENT} t--global-search-modal`}>
          {children}
        </div>
      </Overlay>
    </StyledDocsSearchModal>
  );
}

export default DocsSearchModal;
