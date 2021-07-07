import { ReactComponent as DragHandleIcon } from "assets/icons/ads/app-icons/draghandler.svg";
import { Colors } from "constants/Colors";
import PopperJS, { Placement, PopperOptions } from "popper.js";
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AppState } from "reducers";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import styled, { ThemeProvider } from "styled-components";
import { noop } from "utils/AppsmithUtils";
import { draggableElement } from "./utils";

export type PopperProps = {
  zIndex: number;
  isOpen: boolean;
  themeMode?: ThemeMode;
  targetNode?: Element;
  children: JSX.Element | null;
  placement: Placement;
  modifiers?: Partial<PopperOptions["modifiers"]>;
  isDraggable?: boolean;
  disablePopperEvents?: boolean;
  position?: {
    top: number;
    left: number;
  };
  onPositionChange?: (position: { top: number; left: number }) => void;
};

const PopperWrapper = styled.div<{ zIndex: number }>`
  z-index: ${(props) => props.zIndex};
  position: absolute;
`;

const DragHandleBlock = styled.div`
  padding: 6px;
  height: 28px;
  background-color: ${(props) =>
    props.theme.colors?.propertyPane?.bg || Colors.BLACK};
  cursor: grab;
  box-shadow: 0px 0px 2px rgb(0 0 0 / 10%), 0px 2px 10px rgb(0 0 0 / 10%);
  clip-path: inset(-2px 0px -2px -2px);
`;

export function PopperDragHandle() {
  return (
    <DragHandleBlock>
      <DragHandleIcon />
    </DragHandleBlock>
  );
}

/* eslint-disable react/display-name */
function Popper(props: PopperProps) {
  const contentRef = useRef(null);
  const {
    isDraggable = false,
    disablePopperEvents = false,
    position,
    onPositionChange = noop,
    themeMode = props.themeMode || ThemeMode.LIGHT,
  } = props;
  // Meomoizing to avoid rerender of draggable icon.
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
      // remaines to be discovered.
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
              boundariesElement: "viewport",
            },
            ...props.modifiers,
          },
        },
      );
      if (isDraggable) {
        disablePopperEvents && _popper.disableEventListeners();
        draggableElement(
          "popper",
          _popper.popper,
          onPositionChange,
          position,
          () => (
            <ThemeProvider theme={popperTheme}>
              <PopperDragHandle />
            </ThemeProvider>
          ),
        );
      }

      // return () => {
      //   console.log("Popper", "destroying");
      //   _popper.destroy();
      // };
    }
  }, [
    props.targetNode,
    props.isOpen,
    JSON.stringify(props.modifiers),
    props.placement,
    disablePopperEvents,
  ]);
  return createPortal(
    <PopperWrapper ref={contentRef} zIndex={props.zIndex}>
      {props.children}
    </PopperWrapper>,
    document.body,
  );
}

Popper.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default Popper;
