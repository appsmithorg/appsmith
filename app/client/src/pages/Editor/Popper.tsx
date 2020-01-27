import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import PopperJS from "popper.js";
import PaneWrapper from "pages/common/PaneWrapper";
import { getColorWithOpacity } from "constants/DefaultTheme";
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
  margin: ${props => props.theme.spaces[2]}px;
  box-shadow: 0px 0px 10px ${props => props.theme.colors.paneCard};
  border: ${props => props.theme.spaces[5]}px solid
    ${props => props.theme.colors.paneBG};
  border-right: 0;
  overflow-y: auto;
  padding: 0 ${props => props.theme.spaces[5]}px 0 0;

  scrollbar-color: ${props => props.theme.colors.paneCard}
    ${props => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneCard};
    outline: 1px solid ${props => props.theme.paneText};
    border-radius: ${props => props.theme.radii[1]}px;
  }
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
