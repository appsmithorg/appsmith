import { ReactComponent as DragHandleIcon } from "assets/icons/ads/app-icons/draghandler.svg";
import { Colors } from "constants/Colors";
import PopperJS, { Placement, PopperOptions } from "popper.js";
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AppState } from "reducers";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import styled, { ThemeProvider } from "styled-components";
import { noop } from "utils/AppsmithUtils";
import { generateReactKey } from "utils/generators";
// import { PopperDragHandle } from "./PropertyPane/PropertyPaneConnections";
import { draggableElement } from "./utils";

export type PopperProps = {
  boundaryParent?: Element | PopperJS.Boundary;
  parentElement?: Element | null;
  zIndex: number;
  isOpen: boolean;
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
  placement: Placement;
  modifiers?: Partial<PopperOptions["modifiers"]>;
  isDraggable?: boolean;
  disablePopperEvents?: boolean;
  cypressSelectorDragHandle?: string;
  position?: {
    top: number;
    left: number;
  };
  onPositionChange?: (position: { top: number; left: number }) => void;
  // DraggableNode?: any;
};

const PopperWrapper = styled.div<{ zIndex: number }>`
  z-index: ${(props) => props.zIndex};
  position: absolute;
`;

const DragHandleBlock = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  height: 28px;
  z-index: 3;
  background-color: ${Colors.GREY_1};

  svg {
    transform: rotate(90deg);
  }
`;

export function PopperDragHandle() {
  return (
    <DragHandleBlock>
      <DragHandleIcon />
    </DragHandleBlock>
  );
}

/* eslint-disable react/display-name */
export default (props: PopperProps) => {
  const contentRef = useRef(null);
  const popperIdRef = useRef(generateReactKey());
  const popperId = popperIdRef.current;

  const {
    boundaryParent = "viewport",
    isDraggable = false,
    disablePopperEvents = false,
    position,
    renderDragBlock,
    onPositionChange = noop,
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

  useEffect(() => {
    const parentElement = props.targetNode && props.targetNode.parentElement;

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
        (contentRef.current as unknown) as Element,
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
                <PopperDragHandle />
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
      <PopperWrapper ref={contentRef} zIndex={props.zIndex}>
        {props.children}
      </PopperWrapper>
    ),
    document.body,
  );
};
