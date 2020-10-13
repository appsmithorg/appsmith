import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { Position, Tooltip, Classes } from "@blueprintjs/core";
import { Classes as CsClasses } from "./common";

type Variant = "dark" | "light";

type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  position?: Position;
  children: JSX.Element;
  variant?: Variant;
};

const TooltipWrapper = styled.div<{ variant?: Variant }>`
  .${Classes.TOOLTIP} .${Classes.POPOVER_CONTENT} {
    padding: 10px 12px;
    border-radius: 0px;
    background-color: ${props =>
      props.variant === "dark"
        ? props.theme.colors.tooltip.darkBg
        : props.theme.colors.tooltip.lightBg};
  }
  div.${Classes.POPOVER_ARROW} {
    display: block;
  }
  .${Classes.TOOLTIP} {
    box-shadow: 0px 12px 20px rgba(0, 0, 0, 0.35);
  }
  .${Classes.TOOLTIP}
    .${CsClasses.BP3_POPOVER_ARROW_BORDER},
    &&&&
    .${Classes.TOOLTIP}
    .${CsClasses.BP3_POPOVER_ARROW_FILL} {
    fill: ${props =>
      props.variant === "dark"
        ? props.theme.colors.tooltip.darkBg
        : props.theme.colors.tooltip.lightBg};
  }
`;

const TooltipComponent = (props: TooltipProps) => {
  return (
    <TooltipWrapper variant={props.variant} data-cy={props.cypressSelector}>
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
