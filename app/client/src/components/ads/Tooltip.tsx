import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { Position, Tooltip, Classes, PopperBoundary } from "@blueprintjs/core";
import { Classes as CsClasses } from "./common";

type Variant = "dark" | "light";

type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  position?: Position;
  children: JSX.Element;
  variant?: Variant;
  maxWidth?: number;
  usePortal?: boolean;
  boundary?: PopperBoundary;
};

const TooltipWrapper = styled.div<{ variant?: Variant; maxWidth?: number }>`
  .${Classes.TOOLTIP} .${Classes.POPOVER_CONTENT} {
    padding: 10px 12px;
    border-radius: 0px;
    background-color: ${(props) =>
      props.variant === "dark"
        ? props.theme.colors.tooltip.darkBg
        : props.theme.colors.tooltip.lightBg};
  }
  div.${Classes.POPOVER_ARROW} {
    path {
      fill: ${(props) =>
        props.variant === "dark"
          ? props.theme.colors.tooltip.darkBg
          : props.theme.colors.tooltip.lightBg};
      stroke: ${(props) =>
        props.variant === "dark"
          ? props.theme.colors.tooltip.darkBg
          : props.theme.colors.tooltip.lightBg};
    }
    display: block;
  }
  .${Classes.TOOLTIP} {
    box-shadow: 0px 12px 20px rgba(0, 0, 0, 0.35);
    max-width: ${(props) => (props.maxWidth ? `${props.maxWidth}px` : null)};

  .${Classes.TOOLTIP}
    .${CsClasses.BP3_POPOVER_ARROW_BORDER},
    &&&&
    .${Classes.TOOLTIP}
    .${CsClasses.BP3_POPOVER_ARROW_FILL} {
    fill: ${(props) =>
      props.variant === "dark"
        ? props.theme.colors.tooltip.darkBg
        : props.theme.colors.tooltip.lightBg};
  }
`;

const TooltipComponent = (props: TooltipProps) => {
  return (
    <TooltipWrapper
      variant={props.variant}
      data-cy={props.cypressSelector}
      maxWidth={props.maxWidth}
    >
      <Tooltip
        content={props.content}
        position={props.position}
        usePortal={!!props.usePortal}
        boundary={props.boundary || "scrollParent"}
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
