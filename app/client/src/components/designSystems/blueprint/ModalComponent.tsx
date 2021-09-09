import React, { ReactNode, RefObject, useRef, useEffect, useMemo } from "react";

import { Overlay, Classes } from "@blueprintjs/core";
import { get, noop, omit } from "lodash";
import styled from "styled-components";

import { UIElementSize } from "components/editorComponents/ResizableUtils";
import { Layers } from "constants/Layers";
import { MODAL_PORTAL_CLASSNAME } from "constants/WidgetConstants";
import Resizable from "resizable";
import { getCanvasClassName } from "utils/generators";
import {
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
  BottomHandleStyles,
} from "../../editorComponents/ResizeStyledComponents";

const Container = styled.div<{
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  zIndex?: number;
  maxWidth?: number;
  isEditMode?: boolean;
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
        max-width: ${(props) => {
          if (props.maxWidth) return `${props.maxWidth}px`;

          if (props.isEditMode)
            return `calc(95% - ${props.theme.sidebarWidth}))`;

          return `95%`;
        }};
        max-height: 90%;
        width: ${(props) => (props.width ? `${props.width}px` : "auto")};
        height: ${(props) => (props.height ? `${props.height}px` : "auto")};
        min-height: 100px;
        min-width: 100px;
        background: white;
        border-radius: ${(props) => props.theme.radii[0]}px;
        top: ${(props) => props.top}px;
        left: ${(props) => props.left}px;
        bottom: ${(props) => props.bottom}px;
        right: ${(props) => props.right}px;
        ${(props) => {
          if (props.isEditMode)
            return `transform: translate(${parseInt(props.theme.sidebarWidth) /
              2}px) !important`;
        }}
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
  height: 100%;
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
  enableResize?: boolean;
  resizable?: boolean;
  isEditMode?: boolean;
  resizeModal?: (dimensions: UIElementSize) => void;
  maxWidth?: number;
};

/* eslint-disable react/display-name */
export default function ModalComponent(props: ModalComponentProps) {
  const modalContentRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const { enableResize = false, resizable = false } = props;
  const resizeRef = React.useRef<HTMLDivElement>(null);

  const handles = useMemo(() => {
    const allHandles = {
      left: LeftHandleStyles,
      top: TopHandleStyles,
      bottom: BottomHandleStyles,
      right: RightHandleStyles,
    };

    return omit(allHandles, get(props, "disabledResizeHandles", []));
  }, [props]);

  useEffect(() => {
    if (!props.scrollContents) {
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.scrollContents]);

  const getContent = () => {
    return (
      <Content
        className={`${getCanvasClassName()} ${props.className}`}
        ref={modalContentRef}
        scroll={props.scrollContents}
      >
        {props.children}
      </Content>
    );
  };

  const getResizableContent = () => {
    return (
      <Resizable
        allowResize
        componentHeight={props.height || 0}
        componentWidth={props.width || 0}
        enable={enableResize}
        handles={handles}
        isColliding={() => false}
        onStart={noop}
        onStop={onResizeStop}
        ref={resizeRef}
        resizeDualSides
        showLightBorder
        snapGrid={{ x: 1, y: 1 }}
      >
        {getContent()}
      </Resizable>
    );
  };

  const onResizeStop = (dimensions: UIElementSize) => {
    props.resizeModal && props.resizeModal(dimensions);
  };

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
        isEditMode={props.isEditMode}
        left={props.left}
        maxWidth={props.maxWidth}
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
          {resizable ? getResizableContent() : getContent()}
        </Overlay>
      </Container>
    </Overlay>
  );
}
