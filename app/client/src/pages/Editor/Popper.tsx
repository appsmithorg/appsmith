import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import PopperJS, { Placement, PopperOptions } from "popper.js";
import { noop } from "utils/AppsmithUtils";
import { draggableElement } from "./utils";
import { ReactComponent as DragHandleIcon } from "assets/icons/ads/app-icons/draghandler.svg";
import { Colors } from "constants/Colors";

export type PopperProps = {
  zIndex: number;
  isOpen: boolean;
  targetNode?: Element;
  children: JSX.Element;
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
  margin-left: -14px;
  padding: 6px;
  margin-top: 6px;
  height: 28px;
  background: ${Colors.OUTER_SPACE};
`;

export const PopperDragHandle: React.FC = () => {
  return (
    <DragHandleBlock>
      <DragHandleIcon />
    </DragHandleBlock>
  );
};

/* eslint-disable react/display-name */
export default (props: PopperProps) => {
  const contentRef = useRef(null);
  const {
    isDraggable = false,
    disablePopperEvents = false,
    position,
    onPositionChange = noop,
  } = props;

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
              elementRef.style.transform = "unset";
              elementRef.style.top = position.top + "px";
              elementRef.style.left = position.left + "px";
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
        draggableElement(_popper.popper, onPositionChange, position, () => (
          <PopperDragHandle />
        ));
      }

      return () => {
        _popper.destroy();
      };
    }
  }, [
    props.targetNode,
    props.isOpen,
    props.modifiers,
    props.placement,
    disablePopperEvents,
  ]);
  return createPortal(
    <PopperWrapper ref={contentRef} zIndex={props.zIndex}>
      {props.children}
    </PopperWrapper>,
    document.body,
  );
};
