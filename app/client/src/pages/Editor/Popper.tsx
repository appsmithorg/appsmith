import type { AppState } from "@appsmith/reducers";
import { ReactComponent as DragHandleIcon } from "assets/icons/ads/app-icons/draghandler.svg";
import { Colors } from "constants/Colors";
import type { Placement, PopperOptions } from "popper.js";
import PopperJS from "popper.js";
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import styled, { ThemeProvider } from "styled-components";
import { generateReactKey } from "utils/generators";
// import { PopperDragHandle } from "./PropertyPane/PropertyPaneConnections";
import { draggableElement } from "./utils";

export type PopperProps = {
  boundaryParent?: Element | PopperJS.Boundary;
  parentElement?: Element | null;
  zIndex: number;
  isOpen: boolean;
  borderRadius?: string;
  themeMode?: ThemeMode;
  targetNode?: Element;
  children: JSX.Element | null;
  renderDragBlock?: JSX.Element;
  renderDragBlockPositions?: {
    left?: string;
    top?: string;
    zIndex?: string;
    position?: string;
  };
  style?: React.CSSProperties;
  placement: Placement;
  modifiers?: Partial<PopperOptions["modifiers"]>;
  isDraggable?: boolean;
  disablePopperEvents?: boolean;
  cypressSelectorDragHandle?: string;
  portalContainer?: Element;
  position?: {
    top: number;
    left: number;
  };
  onPositionChange?: (position: { top: number; left: number }) => void;
  setPosition?: (e: any) => void;
  setIsDragging?: (e: any) => void;
  isDragging?: boolean;
  customParent?: Element | undefined;
  editorRef?: React.RefObject<HTMLDivElement>;
  // DraggableNode?: any;
};

const PopperWrapper = styled.div<{ zIndex: number; borderRadius?: string }>`
  z-index: ${(props) => props.zIndex};
  position: absolute;
  border-radius: ${(props) => props.borderRadius || "0"};
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15);
  // overflow: hidden;

  &&&:hover .drag-handle-block {
    display: flex;
  }
`;

const DragHandleBlock = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  height: 28px;
  z-index: 3;
  background-color: ${Colors.GRAY_50};
  position: relative;
  top: -15px;
  pointer-events: auto;
  display: none;

  svg {
    transform: rotate(90deg);
  }
`;

type PopperDragHandleProps = { dragFn?: (val: boolean) => void };

/* eslint-disable react/display-name */
export default (props: PopperProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const popperIdRef = useRef(generateReactKey());
  const popperId = popperIdRef.current;

  const onPositionChangeFn = (e: any) => {
    if (contentRef.current && !!props.setPosition) {
      contentRef.current.style.transform = "unset";
      contentRef.current.style.top = e.top + "px";
      contentRef.current.style.left = e.left + "px";

      props.setPosition(e);

      // add focus back to codemirror component.
      if (
        props?.editorRef &&
        props?.editorRef?.current &&
        props?.editorRef?.current?.children[1] &&
        !!(props?.editorRef?.current?.children[1] as any)?.CodeMirror
      )
        (props?.editorRef?.current?.children[1] as any)?.CodeMirror.focus();
    }
  };

  const {
    boundaryParent = "viewport",
    isDraggable = false,
    disablePopperEvents = false,
    position,
    renderDragBlock,
    onPositionChange = onPositionChangeFn,
    themeMode = props.themeMode || ThemeMode.LIGHT,
    renderDragBlockPositions,
    cypressSelectorDragHandle,
  } = props;

  // Memoizing to avoid rerender of draggable icon.
  // What is the cost of memoizing?
  const popperTheme = useMemo(
    () => getThemeDetails({} as AppState, themeMode),
    [themeMode],
  );

  const PopperDragHandle = (props: PopperDragHandleProps) => {
    return (
      <DragHandleBlock
        className="drag-handle-block"
        onMouseEnter={(e) => {
          e.stopPropagation();
          if (props?.dragFn) {
            props.dragFn(true);
          }
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          if (props?.dragFn) {
            props.dragFn(false);
          }
        }}
      >
        <DragHandleIcon />
      </DragHandleBlock>
    );
  };

  useEffect(() => {
    const parentElement =
      props?.customParent ||
      (props?.targetNode && props.targetNode?.parentElement);

    if (
      parentElement &&
      parentElement.parentElement &&
      props.targetNode &&
      props.isOpen
    ) {
      // TODO: To further optimize this, we can go through the popper API
      // and figure out a way to keep an app instance level popper instance
      // which we can update to have different references when called here.
      // However, the performance benefit gained by such an optimization
      // remains to be discovered.
      const _popper = new PopperJS(
        props.targetNode,
        contentRef.current as unknown as Element,
        {
          ...(isDraggable && disablePopperEvents
            ? {}
            : { placement: props.placement }),
          onCreate: (popperData) => {
            const elementRef: any = popperData.instance.popper;
            if (isDraggable && position) {
              const initPositon =
                position || elementRef.getBoundingClientRect();
              elementRef.style.transform = "unset";
              elementRef.style.top = initPositon.top + "px";
              elementRef.style.left = initPositon.left + "px";
            }
          },
          modifiers: {
            flip: {
              behavior: ["right", "left", "bottom", "top"],
            },
            keepTogether: {
              enabled: false,
            },
            arrow: {
              enabled: false,
            },
            preventOverflow: {
              enabled: true,
              /*
                Prevent the FilterPane from overflowing the canvas when the
                table widget is on the very top of the canvas.
              */
              boundariesElement: boundaryParent,
            },
            ...props.modifiers,
          },
        },
      );
      if (isDraggable) {
        disablePopperEvents && _popper.disableEventListeners();
        draggableElement(
          `${popperId}-popper`,
          _popper.popper,
          onPositionChange,
          parentElement,
          position,
          renderDragBlockPositions,
          () =>
            !!renderDragBlock ? (
              renderDragBlock
            ) : (
              <ThemeProvider theme={popperTheme}>
                <PopperDragHandle dragFn={props.setIsDragging} />
              </ThemeProvider>
            ),
          cypressSelectorDragHandle,
        );
      }

      return () => {
        _popper.destroy();
      };
    }
  }, [
    props.targetNode,
    props.isOpen,
    JSON.stringify(props.modifiers),
    props.placement,
    disablePopperEvents,
  ]);
  return createPortal(
    props.isOpen && (
      <PopperWrapper
        borderRadius={props.borderRadius}
        ref={contentRef}
        style={props.style || {}}
        zIndex={props.zIndex}
      >
        {props.children}
      </PopperWrapper>
    ),
    props.portalContainer ? props.portalContainer : document.body,
  );
};
