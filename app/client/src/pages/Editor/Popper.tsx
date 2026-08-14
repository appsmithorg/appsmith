import type { DefaultRootState } from "react-redux";
import { Icon } from "@appsmith/ads";
import type { Placement, PopperOptions } from "popper.js";
import PopperJS from "popper.js";
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import styled, { ThemeProvider } from "styled-components";
import { generateReactKey } from "utils/generators";
import { draggableElement } from "./utils";

export interface PopperProps {
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPosition?: (e: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setIsDragging?: (e: any) => void;
  isDragging?: boolean;
  customParent?: Element | undefined;
  editorRef?: React.RefObject<HTMLDivElement>;
  // DraggableNode?: any;
}

const PopperWrapper = styled.div<{ zIndex: number; borderRadius?: string }>`
  z-index: ${(props) => props.zIndex};
  position: absolute;
  border-radius: ${(props) => props.borderRadius || "0"};
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15);

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
  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);
  position: relative;
  top: -15px;
  pointer-events: auto;

  :hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

interface PopperDragHandleProps {
  dragFn?: (val: boolean) => void;
}

/* eslint-disable react/display-name */
export default (props: PopperProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const popperIdRef = useRef(generateReactKey());
  const popperId = popperIdRef.current;

  // popper.js v1 only repositions on scroll/resize, so a popper anchored to
  // an auto-growing element (e.g. a CodeMirror field) goes stale as the
  // anchor grows. Track the dragged position in a ref so the resize observer
  // below can skip updates while the user has moved the popper by hand.
  const positionRef = useRef(props.position);

  positionRef.current = props.position;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(props?.editorRef?.current?.children[1] as any)?.CodeMirror
      )
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (props?.editorRef?.current?.children[1] as any)?.CodeMirror.focus();
    }
  };

  const {
    boundaryParent = "viewport",
    cypressSelectorDragHandle,
    disablePopperEvents = false,
    isDraggable = false,
    onPositionChange = onPositionChangeFn,
    position,
    renderDragBlock,
    renderDragBlockPositions,
    themeMode = props.themeMode || ThemeMode.LIGHT,
  } = props;

  // Memoizing to avoid rerender of draggable icon.
  // What is the cost of memoizing?
  const popperTheme = useMemo(
    () => getThemeDetails({} as DefaultRootState, themeMode),
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
        <Icon name="drag-handle" size="lg" />
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
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      let resizeObserver: ResizeObserver | undefined;

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          if (!positionRef.current) _popper.scheduleUpdate();
        });
        resizeObserver.observe(props.targetNode);

        // Also track the popper's own size: collapsing/expanding its content
        // changes the box and the position must be recomputed immediately.
        if (contentRef.current) resizeObserver.observe(contentRef.current);
      }

      // popper's own scroll listeners only cover the scroll parents it can
      // detect; the editor's app-shell scrollers escape that walk, leaving the
      // popup stranded at stale coordinates when the form scrolls. A capture-
      // phase listener on window sees scroll events from every nested
      // container. Skipped while the user has dragged the popup by hand.
      let scrollRaf = 0;
      const onAnyScroll = () => {
        if (positionRef.current) return;

        cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(() => _popper.scheduleUpdate());
      };

      window.addEventListener("scroll", onAnyScroll, {
        capture: true,
        passive: true,
      });

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
        cancelAnimationFrame(scrollRaf);
        window.removeEventListener("scroll", onAnyScroll, { capture: true });
        resizeObserver?.disconnect();
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
