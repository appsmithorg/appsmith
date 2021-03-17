import React from "react";
import { CommonComponentProps } from "./common";
import { Position, Tooltip, PopperBoundary } from "@blueprintjs/core";
import { GLOBAL_STYLE_TOOLTIP_CLASSNAME } from "globalStyles/tooltip";

type Variant = "dark" | "light";

type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  position?: Position;
  children: JSX.Element;
  variant?: Variant;
  maxWidth?: string;
  boundary?: PopperBoundary;
  minWidth?: string;
  openOnTargetFocus?: boolean;
  autoFocus?: boolean;
  hoverOpenDelay?: number;
  minimal?: boolean;
};

const TooltipComponent = (props: TooltipProps) => {
  return (
    <Tooltip
      content={props.content}
      position={props.position}
      usePortal
      boundary={props.boundary || "scrollParent"}
      autoFocus={props.autoFocus}
      hoverOpenDelay={props.hoverOpenDelay}
      openOnTargetFocus={props.openOnTargetFocus}
      minimal={props.minimal}
      popoverClassName={GLOBAL_STYLE_TOOLTIP_CLASSNAME}
    >
      {props.children}
    </Tooltip>
  );
};

TooltipComponent.defaultProps = {
  position: Position.TOP,
  variant: "dark",
};

export default TooltipComponent;
