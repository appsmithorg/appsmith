import React, { ReactNode } from "react";
import { Overlay, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { getCanvasClassName } from "utils/generators";
const CloseModalControl = ControlIcons.CLOSE_CONTROL;
const Container = styled.div<{
  width: number;
  scroll: boolean;
  height: number;
}>`
  &&& {
    .${Classes.OVERLAY} {
      .${Classes.OVERLAY_BACKDROP} {
        z-index: 1;
      }
      position: fixed;
      top: ${props => props.theme.headerHeight};
      right: 0;
      bottom: 0;
      height: 100vh;
      z-index: 1;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      & .${Classes.OVERLAY_CONTENT} {
        width: ${props => props.width}px;
        min-height: ${props => props.height}px;
        background: white;
        border-radius: ${props => props.theme.radii[1]}px;
      }
    }
  }
`;
const Content = styled.div<{ height: number }>`
  overflow-y: visible;
  overflow-x: hidden;
  width: 100%;
  max-height: ${props => props.height}px;
`;

const CloseModalTrigger = styled(CloseModalControl)`
  position: absolute;
  right: -30px;
  top: 0px;
  cursor: pointer;
`;

export type ModalComponentProps = {
  isOpen: boolean;
  onClose: (e: any) => void;
  children: ReactNode;
  width: number;
  className?: string;
  canOutsideClickClose: boolean;
  canEscapeKeyClose: boolean;
  scrollContents: boolean;
  height: number;
};

/* eslint-disable react/display-name */
export const ModalComponent = (props: ModalComponentProps) => {
  return (
    <Container
      width={props.width}
      height={props.height}
      scroll={props.scrollContents}
    >
      <Overlay
        isOpen={props.isOpen}
        onClose={props.onClose}
        canOutsideClickClose={props.canOutsideClickClose}
        canEscapeKeyClose={props.canEscapeKeyClose}
        usePortal={false}
        enforceFocus={false}
      >
        <div>
          <CloseModalTrigger onClick={props.onClose} />
          <Content
            className={`${getCanvasClassName()} ${props.className}`}
            height={props.height}
          >
            {props.children}
          </Content>
        </div>
      </Overlay>
    </Container>
  );
};

export default ModalComponent;
