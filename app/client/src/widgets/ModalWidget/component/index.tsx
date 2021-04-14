import React, { ReactNode, RefObject, useRef, useEffect } from "react";
import { Overlay, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { getCanvasClassName } from "utils/generators";

const Container = styled.div<{
  width: number;
  height: number;
  top?: number;
  left?: number;
  zIndex?: number;
}>`
  &&& {
    .${Classes.OVERLAY} {
      .${Classes.OVERLAY_BACKDROP} {
        z-index: ${(props) => props.zIndex || 2 - 1};
      }
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      height: 100vh;
      z-index: ${(props) => props.zIndex};
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      & .${Classes.OVERLAY_CONTENT} {
        max-width: 95%;
        width: ${(props) => props.width}px;
        min-height: ${(props) => props.height}px;
        background: white;
        border-radius: ${(props) => props.theme.radii[0]}px;
        top: ${(props) => props.top}px;
        left: ${(props) => props.left}px;
      }
    }
  }
`;
const Content = styled.div<{
  height: number;
  scroll: boolean;
  ref: RefObject<HTMLDivElement>;
}>`
  overflow-y: ${(props) => (props.scroll ? "visible" : "hidden")};
  overflow-x: hidden;
  width: 100%;
  height: ${(props) => props.height}px;
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
  top?: number;
  left?: number;
  hasBackDrop?: boolean;
  zIndex?: number;
};

/* eslint-disable react/display-name */
export const ModalComponent = (props: ModalComponentProps) => {
  const modalContentRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  useEffect(() => {
    if (!props.scrollContents) {
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.scrollContents]);
  return (
    <Container
      width={props.width}
      height={props.height}
      top={props.top}
      left={props.left}
      zIndex={props.zIndex !== undefined ? props.zIndex : 2}
    >
      <Overlay
        isOpen={props.isOpen}
        onClose={props.onClose}
        canOutsideClickClose={props.canOutsideClickClose}
        canEscapeKeyClose={props.canEscapeKeyClose}
        usePortal={false}
        enforceFocus={false}
        hasBackdrop={
          props.hasBackDrop !== undefined ? !!props.hasBackDrop : true
        }
      >
        <div>
          <Content
            scroll={props.scrollContents}
            className={`${getCanvasClassName()} ${props.className}`}
            height={props.height}
            ref={modalContentRef}
          >
            {props.children}
          </Content>
        </div>
      </Overlay>
    </Container>
  );
};

export default ModalComponent;
