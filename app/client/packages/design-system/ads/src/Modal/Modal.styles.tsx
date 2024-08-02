import styled, { keyframes } from "styled-components";
import { Overlay, Content, Close } from "@radix-ui/react-dialog";
import {
  ModalContentBodyClassName,
  ModalContentFooterClassName,
} from "./Modal.constants";

const overlayShow = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const contentShow = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -40%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -40%) scale(1);
  }
`;

export const StyledOverlay = styled(Overlay)`
  /* TODO: Opacity for colors needs to be handled in a better way*/
  background-color: #39393999;
  position: fixed;
  inset: 0;
  animation: ${overlayShow} 250ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000;
`;

export const StyledContent = styled(Content)`
  background-color: var(--ads-v2-colors-content-surface-default-bg);
  border-radius: var(--ads-v2-border-radius);
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -40%);
  width: 50vw;
  max-width: 90vw;
  max-height: 85vh;
  padding: var(--ads-v2-spaces-5) var(--ads-v2-spaces-6);
  animation: ${contentShow} 250ms cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  z-index: 1001;
`;

export const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--ads-v2-spaces-3);

  & > h3 {
    max-width: 90%;
    word-wrap: break-word;
  }
`;

export const StyledClose = styled(Close)`
  all: unset;
  cursor: pointer;
`;

export const StyledBody = styled.div.attrs({
  className: ModalContentBodyClassName,
})`
  padding-top: var(--ads-v2-spaces-5);
  flex: 1;
  overflow-y: auto;
`;

export const StyledFooter = styled.div.attrs({
  className: ModalContentFooterClassName,
})`
  display: flex;
  justify-content: flex-end;
  padding-top: var(--ads-v2-spaces-5);
  gap: var(--ads-v2-spaces-3);
`;
