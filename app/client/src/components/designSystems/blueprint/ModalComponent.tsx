import React, { ReactNode, RefObject, useRef, useEffect } from "react";
import { Overlay, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { getCanvasClassName } from "utils/generators";
import { Layers } from "constants/Layers";
import { MODAL_PORTAL_CLASSNAME } from "constants/WidgetConstants";
import { noop } from "utils/AppsmithUtils";
import { debounce } from "lodash";

const ResizableDiv = styled.div<{ resizable: boolean }>`
  ${(props) =>
    props.resizable
      ? `resize: both;
   overflow: auto;`
      : ""}
`;

const Container = styled.div<{
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
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
        width: ${(props) => (props.width ? `${props.width}px` : "auto")};
        min-height: ${(props) => (props.height ? `${props.height}px` : "auto")};
        background: white;
        border-radius: ${(props) => props.theme.radii[0]}px;
        top: ${(props) => props.top}px;
        left: ${(props) => props.left}px;
        bottom: ${(props) => props.bottom}px;
        right: ${(props) => props.right}px;
      }
    }
  }
`;
const Content = styled.div<{
  height?: number;
  scroll: boolean;
  ref: RefObject<HTMLDivElement>;
}>`
  overflow-y: ${(props) => (props.scroll ? "visible" : "hidden")};
  overflow-x: hidden;
  width: 100%;
  height: ${(props) => (props.height ? `${props.height}px` : "auto")};
`;

export type ModalComponentProps = {
  isOpen: boolean;
  onClose: (e: any) => void;
  onModalClose?: () => void;
  children: ReactNode;
  width?: number;
  className?: string;
  usePortal?: boolean;
  portalContainer?: HTMLElement;
  canOutsideClickClose: boolean;
  canEscapeKeyClose: boolean;
  overlayClassName?: string;
  scrollContents: boolean;
  height?: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  hasBackDrop?: boolean;
  zIndex?: number;
  portalClassName?: string;
  resizable?: boolean;
  onResize?: (height: number, width: number) => void;
};

/* eslint-disable react/display-name */
export function ModalComponent(props: ModalComponentProps) {
  const modalContentRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const { resizable = false, onResize = noop } = props;
  const resizeRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (resizeRef.current && resizable) {
      const debouncedResize = debounce(onResize, 500);
      const resizeObserver = new ResizeObserver(function() {
        const height = resizeRef.current?.offsetHeight || 0;
        const width = resizeRef.current?.offsetWidth || 0;
        debouncedResize(height, width);
      });
      resizeObserver.observe(resizeRef.current);
    }
    return () => {
      // handle modal close events when this component unmounts
      // will be called in all cases :-
      //  escape key press, click out side, close click from other btn widget
      if (props.onModalClose) props.onModalClose();
    };
  }, []);
  useEffect(() => {
    if (!props.scrollContents) {
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.scrollContents]);
  return (
    <Overlay
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      enforceFocus={false}
      hasBackdrop={false}
      isOpen={props.isOpen}
      onClose={props.onClose}
      portalClassName={`${MODAL_PORTAL_CLASSNAME} ${props.portalClassName}`}
      portalContainer={props.portalContainer}
      usePortal={props.usePortal}
    >
      <Container
        bottom={props.bottom}
        height={props.height}
        left={props.left}
        right={props.bottom}
        top={props.top}
        width={props.width}
        zIndex={props.zIndex !== undefined ? props.zIndex : Layers.modalWidget}
      >
        <Overlay
          canEscapeKeyClose={props.canEscapeKeyClose}
          canOutsideClickClose={props.canOutsideClickClose}
          className={props.overlayClassName}
          enforceFocus={false}
          hasBackdrop={
            props.hasBackDrop !== undefined ? !!props.hasBackDrop : true
          }
          isOpen={props.isOpen}
          onClose={props.onClose}
          usePortal={false}
        >
          <ResizableDiv ref={resizeRef} resizable={resizable}>
            <Content
              className={`${getCanvasClassName()} ${props.className}`}
              height={props.height}
              ref={modalContentRef}
              scroll={props.scrollContents}
            >
              {props.children}
            </Content>
          </ResizableDiv>
        </Overlay>
      </Container>
    </Overlay>
  );
}

export default ModalComponent;
