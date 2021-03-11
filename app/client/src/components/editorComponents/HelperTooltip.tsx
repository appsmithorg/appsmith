import React from "react";
import { Popover, PopoverInteractionKind } from "@blueprintjs/core";
import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "constants/Colors";

const TooltipStyles = createGlobalStyle`
 .helper-tooltip{
  .bp3-popover {
    box-shadow: none;
    max-width: 258px;
    .bp3-popover-arrow {
      display: block;
      fill: none;
    }
    .bp3-popover-arrow-fill {
      fill:  ${Colors.BLUE_CHARCOAL};
    }
    .bp3-popover-content {
      padding: 15px;
      background-color: ${Colors.BLUE_CHARCOAL};
      color: #fff;
      text-align: left;
      border-radius: 4px;
      text-transform: initial;
      font-weight: 500;
      font-size: 14px;
      line-height: 18px;
    }
  }
 }
`;

const IconContainer = styled.div`
  .bp3-icon {
    border-radius: 4px 0 0 4px;
    margin: 0;
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #eef2f5;
    svg {
      height: 20px;
      width: 20px;
      path {
        fill: #979797;
      }
    }
  }
  .bp3-popover-target {
    padding-right: 10px;
  }
`;

interface Props {
  description?: string;
  // TODO(Hetu): Fix the banned type here
  // eslint-disable-next-line @typescript-eslint/ban-types
  rightIcon: Function;
}

function HelperTooltip(props: Props) {
  return (
    <>
      <TooltipStyles />
      <Popover
        autoFocus
        canEscapeKeyClose
        content={props.description}
        defaultIsOpen={false}
        interactionKind={PopoverInteractionKind.HOVER}
        portalClassName="helper-tooltip"
        position="bottom"
        usePortal
      >
        <IconContainer>
          <props.rightIcon height={22} width={22} />
        </IconContainer>
      </Popover>
    </>
  );
}

export default HelperTooltip;
