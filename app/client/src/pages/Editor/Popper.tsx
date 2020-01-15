import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import PopperJS from "popper.js";
import PaneWrapper from "pages/common/PaneWrapper";

type PopperProps = {
  isOpen: boolean;
  targetNode?: Element;
  children: JSX.Element;
};

const PopperWrapper = styled(PaneWrapper)`
  position: absolute;
  z-index: 3;
  max-height: ${props => props.theme.propertyPane.height}px;
  width: ${props => props.theme.propertyPane.width}px;
  margin: ${props => props.theme.spaces[6]}px;
  overflow-y: auto;
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
          placement: "right-start",
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
          },
        },
      );
      _popper.disableEventListeners();
      return () => {
        _popper.destroy();
      };
    }
  }, [props.targetNode, props.isOpen]);
  return createPortal(
    <PopperWrapper ref={contentRef}>{props.children}</PopperWrapper>,
    document.body,
  );
};
