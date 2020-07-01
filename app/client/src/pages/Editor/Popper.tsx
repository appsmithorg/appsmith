import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import PopperJS, { Placement, PopperOptions } from "popper.js";

type PopperProps = {
  zIndex: number;
  isOpen: boolean;
  targetNode?: Element;
  children: JSX.Element;
  placement: Placement;
  modifiers?: Partial<PopperOptions["modifiers"]>;
};

const PopperWrapper = styled.div<{ zIndex: number }>`
  z-index: ${props => props.zIndex};
  position: absolute;
`;

/* eslint-disable react/display-name */
export default (props: PopperProps) => {
  const contentRef = useRef(null);
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
          placement: props.placement,
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
      _popper.disableEventListeners();
      return () => {
        _popper.destroy();
      };
    }
  }, [props.targetNode, props.isOpen, props.modifiers, props.placement]);
  return createPortal(
    <PopperWrapper ref={contentRef} zIndex={props.zIndex}>
      {props.children}
    </PopperWrapper>,
    document.body,
  );
};
