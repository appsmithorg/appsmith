import React from "react";
import { Popover } from "@blueprintjs/core";
import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "constants/Colors";

const TooltipStyles = createGlobalStyle`
 .error-tooltip{
  .bp3-popover {
    .bp3-popover-arrow {
      display: block;
    }
    .bp3-popover-content {
      padding: 8px;
      color: ${Colors.ERROR_RED};
      text-align: center;
      border-radius: 0;
      text-transform: initial;
      font-weight: 500;
      font-size: 12px;
      line-height: 16px;
    }
  }
 }
`;

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  height: auto;
  .bp3-popover-target {
    width: 100%;
    height: 100%;
  }
`;

interface Props {
  boundary?: string;
  isOpen: boolean;
  message: string;
  children: JSX.Element;
  customClass?: string;
}

function ErrorTooltip(props: Props) {
  let conditionalProps = {};
  let containerElement;

  if (
    props.boundary &&
    (containerElement = document.querySelector(props.boundary))
  ) {
    conditionalProps = {
      modifiers: {
        flip: {
          enabled: true,
          boundariesElement: containerElement,
        },
        preventOverflow: {
          enabled: true,
          boundariesElement: containerElement,
        },
      },
    };
  }

  return (
    <Wrapper>
      <TooltipStyles />
      <Popover
        autoFocus
        canEscapeKeyClose
        content={props.message}
        isOpen={props.isOpen && !!props.message}
        portalClassName={`error-tooltip ${props.customClass || ""}`}
        position={props.boundary ? "auto" : "bottom"}
        usePortal
        {...conditionalProps}
      >
        {props.children}
      </Popover>
    </Wrapper>
  );
}

export default ErrorTooltip;
