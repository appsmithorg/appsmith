import React from "react";
import { Popover } from "@blueprintjs/core";
import styled from "styled-components";

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  .bp3-popover-target {
    width: 100%;
    height: 100%;
  }
  .bp3-popover {
    .bp3-popover-arrow {
      display: block;
    }
    .bp3-popover-content {
      padding: 8px;
      color: ${props => props.theme.colors.error};
      text-align: center;
      border-radius: 4px;
      text-transform: initial;
      font-weight: 500;
      font-size: 12px;
      line-height: 16px;
    }
  }
`;

interface Props {
  isOpen: boolean;
  message: string;
  children: JSX.Element;
}

const ErrorTooltip = (props: Props) => {
  return (
    <Wrapper>
      <Popover
        autoFocus={true}
        canEscapeKeyClose={true}
        content={props.message}
        position="bottom"
        isOpen={props.isOpen && !!props.message}
        usePortal={false}
        modifiers={{
          offset: { offset: "0,0,-11px" },
        }}
      >
        {props.children}
      </Popover>
    </Wrapper>
  );
};

export default ErrorTooltip;
