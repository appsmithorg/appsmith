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
  height: 100%;
  .bp3-popover-target {
    width: 100%;
    height: 100%;
  }
`;

interface Props {
  isOpen: boolean;
  message: string;
  children: JSX.Element;
  customClass?: string;
}

function ErrorTooltip(props: Props) {
  return (
    <Wrapper>
      <TooltipStyles />
      <Popover
        autoFocus
        canEscapeKeyClose
        content={props.message}
        isOpen={props.isOpen && !!props.message}
        portalClassName={`error-tooltip ${props.customClass || ""}`}
        position="bottom"
        usePortal
      >
        {props.children}
      </Popover>
    </Wrapper>
  );
}

export default ErrorTooltip;
