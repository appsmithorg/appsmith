import React, { useCallback } from "react";
import styled from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";
import {
  createMessage,
  CONFLICTS_FOUND_WHILE_PULLING_CHANGES,
} from "ee/constants/messages";

import { Button } from "@appsmith/ads";
import noop from "lodash/noop";
import GitConflictError from "../GitConflictError";

const StyledGitErrorPopup = styled.div`
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
        bottom: 52px;
        left: 12px;
        background-color: #ffffff;
      }
    }

    .git-error-popup {
      width: 364px;
      padding: ${(props) => props.theme.spaces[7]}px;

      display: flex;
      flex-direction: column;
    }
  }
`;

interface DumbGitConflictErrorModalProps {
  isConflictErrorModalOpen?: boolean;
  toggleConflictErrorModal?: (open: boolean) => void;
}

function DumbGitConflictErrorModal({
  isConflictErrorModalOpen = false,
  toggleConflictErrorModal = noop,
}: DumbGitConflictErrorModalProps) {
  const handleClose = useCallback(() => {
    toggleConflictErrorModal(false);
  }, [toggleConflictErrorModal]);

  return (
    <StyledGitErrorPopup>
      <Overlay
        hasBackdrop
        isOpen={isConflictErrorModalOpen}
        onClose={handleClose}
        transitionDuration={25}
        usePortal={false}
      >
        <div className={Classes.OVERLAY_CONTENT}>
          <div className="git-error-popup">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="title">
                  {createMessage(CONFLICTS_FOUND_WHILE_PULLING_CHANGES)}
                </span>
              </div>
              <Button
                isIconButton
                kind="tertiary"
                onClick={handleClose}
                size="sm"
                startIcon="close-modal"
              />
            </div>
            <GitConflictError />
          </div>
        </div>
      </Overlay>
    </StyledGitErrorPopup>
  );
}

export default DumbGitConflictErrorModal;
