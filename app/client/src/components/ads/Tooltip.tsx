import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { Position, Tooltip } from "@blueprintjs/core";

type Variant = "dark" | "light";

type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  position?: Position;
  children: JSX.Element;
  variant?: Variant;
};

const TooltipWrapper = styled.div<{ variant?: Variant }>`
  .bp3-tooltip .bp3-popover-content {
    padding: 10px 12px;
    border-radius: 0px;
    background-color: ${props =>
      props.variant === "dark"
        ? props.theme.colors.blackShades[0]
        : props.theme.colors.blackShades[8]};
  }
  div.bp3-popover-arrow {
    display: block;
  }
  .bp3-tooltip {
    box-shadow: 0px 12px 20px rgba(0, 0, 0, 0.35);a
  }
  .bp3-tooltip .bp3-popover-arrow-border,
  &&&& .bp3-tooltip .bp3-popover-arrow-fill {
    fill: ${props =>
      props.variant === "dark"
        ? props.theme.colors.blackShades[0]
        : props.theme.colors.blackShades[8]};
  }
`;

const TooltipComponent = (props: TooltipProps) => {
  return (
    <TooltipWrapper variant={props.variant}>
      <Tooltip
        content={props.content}
        position={props.position}
        usePortal={false}
      >
        {props.children}
      </Tooltip>
    </TooltipWrapper>
  );
};

TooltipComponent.defaultProps = {
  position: Position.TOP,
  variant: "dark",
};

export default TooltipComponent;
