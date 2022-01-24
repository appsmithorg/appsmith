import React, {
  ReactNode,
  RefObject,
  useRef,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Overlay, Classes } from "@blueprintjs/core";
import { get, omit } from "lodash";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { UIElementSize } from "components/editorComponents/ResizableUtils";
import {
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
  BottomHandleStyles,
} from "components/editorComponents/ResizeStyledComponents";
import { Layers } from "constants/Layers";
import Resizable from "resizable/resize";
import { getCanvasClassName } from "utils/generators";
import { AppState } from "reducers";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { closeTableFilterPane } from "actions/widgetActions";

const Container = styled.div<{
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  zIndex?: number;
  maxWidth?: number;
  minSize?: number;
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
        max-height: 85%;
        width: ${(props) => (props.width ? `${props.width}px` : "auto")};
        height: ${(props) => (props.height ? `${props.height}px` : "auto")};
        min-height: ${(props) => `${props.minSize}px`};
        min-width: ${(props) => `${props.minSize}px`};
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
  height: 100%;
`;

const ComponentContainer = styled.div<{
  modalPosition: string;
}>`
  > .${Classes.OVERLAY} {
    > .${Classes.OVERLAY_CONTENT} {
      position: ${(props) => props.modalPosition};
    }
  }
`;

export type ModalComponentProps = {
  isOpen: boolean;
  onClose: (e: any) => void;
  onModalClose?: () => void;
  children: ReactNode;
  width?: number;
  className?: string;
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
  zIndex?: number;
  enableResize?: boolean;
  isEditMode?: boolean;
  resizeModal?: (dimensions: UIElementSize) => void;
  maxWidth?: number;
  minSize?: number;
  widgetName: string;
};

/* eslint-disable react/display-name */
export default function ModalComponent(props: ModalComponentProps) {
  const modalContentRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const { enableResize = false } = props;
  const resizeRef = React.useRef<HTMLDivElement>(null);

  const [modalPosition, setModalPosition] = useState<string>("fixed");

  const { setIsResizing } = useWidgetDragResize();
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  const dispatch = useDispatch();
  const isTableFilterPaneVisible = useSelector(
    (state: AppState) => state.ui.tableFilterPane.isVisible,
  );

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
    setTimeout(() => {
      setModalPosition("unset");
    }, 100);
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

  useEffect(() => {
    if (props.isOpen && isTableFilterPaneVisible) {
      dispatch(closeTableFilterPane());
    }
  }, [props.isOpen]);

  const onResizeStop = (dimensions: UIElementSize) => {
    props.resizeModal && props.resizeModal(dimensions);
    // Tell the Canvas that we've stopped resizing
    // Put it later in the stack so that other updates like click, are not propagated to the parent container
    setTimeout(() => {
      setIsResizing && setIsResizing(false);
    }, 0);
  };

  const onResizeStart = () => {
    setIsResizing && !isResizing && setIsResizing(true);
    AnalyticsUtil.logEvent("WIDGET_RESIZE_START", {
      widgetName: props.widgetName,
      widgetType: "MODAL_WIDGET",
    });
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
        onStart={onResizeStart}
        onStop={onResizeStop}
        ref={resizeRef}
        resizeDualSides
        showLightBorder
        snapGrid={{ x: 1, y: 1 }}
      >
        <Content
          className={`${getCanvasClassName()} ${props.className}`}
          ref={modalContentRef}
          scroll={props.scrollContents}
        >
          {props.children}
        </Content>
      </Resizable>
    );
  };

  const getEditorView = () => {
    return (
      <Overlay
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        enforceFocus={false}
        hasBackdrop={false}
        isOpen={props.isOpen}
        onClose={props.onClose}
        usePortal={false}
      >
        <Container
          bottom={props.bottom}
          height={props.height}
          isEditMode={props.isEditMode}
          left={props.left}
          maxWidth={props.maxWidth}
          minSize={props.minSize}
          right={props.bottom}
          top={props.top}
          width={props.width}
          zIndex={
            props.zIndex !== undefined ? props.zIndex : Layers.modalWidget
          }
        >
          <Overlay
            canEscapeKeyClose={props.canEscapeKeyClose}
            canOutsideClickClose={props.canOutsideClickClose}
            className={props.overlayClassName}
            enforceFocus={false}
            hasBackdrop
            isOpen={props.isOpen}
            onClose={props.onClose}
            usePortal={false}
          >
            {getResizableContent()}
          </Overlay>
        </Container>
      </Overlay>
    );
  };

  const getPageView = () => {
    return (
      <ComponentContainer modalPosition={modalPosition}>
        {getEditorView()}
      </ComponentContainer>
    );
  };
  return props.isEditMode ? getEditorView() : getPageView();
}
