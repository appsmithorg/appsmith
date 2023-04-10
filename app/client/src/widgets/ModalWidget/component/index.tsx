import type { ReactNode, RefObject } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Classes, Overlay } from "@blueprintjs/core";
import { get, omit } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import type { AppState } from "@appsmith/reducers";
import { closeTableFilterPane } from "actions/widgetActions";
import type { UIElementSize } from "components/editorComponents/ResizableUtils";
import {
  BottomHandleStyles,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
} from "components/editorComponents/ResizeStyledComponents";
import { Colors } from "constants/Colors";
import { Layers } from "constants/Layers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCanvasClassName } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { scrollCSS } from "widgets/WidgetUtils";
import Resizable from "resizable/modalresize";
import { getAppViewHeaderHeight } from "selectors/appViewSelectors";
import { getCurrentThemeDetails } from "selectors/themeSelectors";

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
  headerHeight?: number;
  smallHeaderHeight?: string;
}>`
  &&& {
    .${Classes.OVERLAY} {
      .${Classes.OVERLAY_BACKDROP} {
        z-index: ${(props) => props.zIndex || 2 - 1};
      }
      position: fixed;
      top: ${(props) =>
        `calc(${props.headerHeight}px + ${
          props.isEditMode ? props.smallHeaderHeight : "0px"
        })`};
      right: 0;
      bottom: 0;
      height: ${(props) =>
        `calc(100vh - (${props.headerHeight}px + ${
          props.isEditMode ? props.smallHeaderHeight : "0px"
        }))`};
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
        max-height: ${(props) => (props.isEditMode ? "85%" : "95%")};
        width: ${(props) => (props.width ? `${props.width}px` : "auto")};
        height: ${(props) => (props.height ? `${props.height}px` : "auto")};
        min-height: ${(props) => `${props.minSize}px`};
        min-width: ${(props) => `${props.minSize}px`};
        top: ${(props) => props.top}px;
        left: ${(props) => props.left}px;
        bottom: ${(props) => props.bottom}px;
        right: ${(props) => props.right}px;
      }
    }
  }
`;
const Content = styled.div<{ $scroll: boolean }>`
  overflow-x: hidden;
  width: 100%;
  height: 100%;
  ${scrollCSS}
  ${(props) => (!props.$scroll ? `overflow: hidden;` : ``)}
`;

const Wrapper = styled.div<{
  $background?: string;
  $borderRadius?: string;
}>`
  overflow: hidden;
  width: 100%;
  height: 100%;
  background: ${({ $background }) => `${$background || Colors.WHITE}`};
  border-radius: ${({ $borderRadius }) => $borderRadius};
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
  widgetId: string;
  widgetName: string;
  isDynamicHeightEnabled: boolean;
  background?: string;
  borderRadius?: string;
  settingsComponent?: ReactNode;
  isAutoLayout: boolean;
};

/* eslint-disable react/display-name */
export default function ModalComponent(props: ModalComponentProps) {
  const modalContentRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);
  const { enableResize = false } = props;

  const [modalPosition, setModalPosition] = useState<string>("fixed");
  const { setIsResizing } = useWidgetDragResize();
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  const dispatch = useDispatch();
  const isTableFilterPaneVisible = useSelector(
    (state: AppState) => state.ui.tableFilterPane.isVisible,
  );
  const disabledResizeHandles = get(props, "disabledResizeHandles", []);
  const handles = useMemo(() => {
    const allHandles = {
      left: LeftHandleStyles,
      top: TopHandleStyles,
      bottom: BottomHandleStyles,
      right: RightHandleStyles,
    };

    return omit(allHandles, disabledResizeHandles);
  }, [disabledResizeHandles]);
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const theme = useSelector(getCurrentThemeDetails);

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
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (props.canEscapeKeyClose) props.onClose(e);
    }
  };

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

  const isVerticalResizeEnabled = useMemo(() => {
    return !props.isDynamicHeightEnabled && enableResize && !props.isAutoLayout;
  }, [props.isDynamicHeightEnabled, enableResize]);

  const getResizableContent = () => {
    //id for Content is required for Copy Paste inside the modal
    return (
      <Resizable
        allowResize
        componentHeight={props.height || 0}
        componentWidth={props.width || 0}
        enableHorizontalResize={enableResize}
        enableVerticalResize={isVerticalResizeEnabled}
        handles={handles}
        isColliding={() => false}
        onStart={onResizeStart}
        onStop={onResizeStop}
        resizeDualSides
        showLightBorder
        snapGrid={{ x: 1, y: 1 }}
        widgetId={props.widgetId}
      >
        {props.settingsComponent}
        <Wrapper
          $background={props.background}
          $borderRadius={props.borderRadius}
          data-cy="modal-wrapper"
        >
          <Content
            $scroll={!!props.scrollContents}
            className={`${getCanvasClassName()} ${
              props.className
            } scroll-parent`}
            id={props.widgetId}
            ref={modalContentRef}
            tabIndex={0}
          >
            {props.children}
          </Content>
        </Wrapper>
      </Resizable>
    );
  };

  const getEditorView = () => {
    return (
      <Overlay
        autoFocus={false}
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
          headerHeight={headerHeight}
          height={props.height}
          isEditMode={props.isEditMode}
          left={props.left}
          maxWidth={props.maxWidth}
          minSize={props.minSize}
          right={props.bottom}
          smallHeaderHeight={theme.smallHeaderHeight}
          top={props.top}
          width={props.width}
          zIndex={
            props.zIndex !== undefined ? props.zIndex : Layers.modalWidget
          }
        >
          <Overlay
            autoFocus={false}
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
