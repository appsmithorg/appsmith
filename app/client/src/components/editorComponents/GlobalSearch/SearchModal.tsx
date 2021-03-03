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
      onClosing={() => {
        AnalyticsUtil.logEvent("CLOSE_OMNIBAR");
      }}
      transitionDuration={25}
    >
      <div className={`${Classes.OVERLAY_CONTENT} t--global-search-modal`}>
        {children}
      </div>
    </Overlay>
  </StyledDocsSearchModal>
);

export default DocsSearchModal;
