import React from "react";
import { CommonComponentProps } from "./common";
import { createGlobalStyle } from "styled-components";
import { Position, Tooltip, Classes, PopperBoundary } from "@blueprintjs/core";
import { Classes as CsClasses } from "./common";
import { Theme } from "constants/DefaultTheme";

type Variant = "dark" | "light";

type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  position?: Position;
  children: JSX.Element;
  variant?: Variant;
  maxWidth?: number;
  boundary?: PopperBoundary;
  minWidth?: number;
  openOnTargetFocus?: boolean;
  autoFocus?: boolean;
  hoverOpenDelay?: number;
  minimal?: boolean;
};

const TooltipStyles = createGlobalStyle<{
  variant?: Variant;
  maxWidth?: number;
  minWidth?: number;
  theme: Theme;
}>`
  .${Classes.PORTAL} {
    .${Classes.TOOLTIP} .${Classes.POPOVER_CONTENT} {
      padding: 10px 12px;
      border-radius: 0px;
      background-color: ${(props) =>
        props.variant === "dark"
          ? props.theme.colors.tooltip.darkBg
          : props.theme.colors.tooltip.lightBg};
      color: ${(props) =>
        props.variant === "dark"
          ? props.theme.colors.tooltip.darkText
          : props.theme.colors.tooltip.lightText};
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
      min-width: ${(props) => (props.minWidth ? `${props.minWidth}px` : null)};
    }
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
  }
`;

const TooltipComponent = (props: TooltipProps) => {
  return (
    <div>
      <Tooltip
        content={props.content}
        position={props.position}
        usePortal
        boundary={props.boundary || "scrollParent"}
        autoFocus={props.autoFocus}
        hoverOpenDelay={props.hoverOpenDelay}
        openOnTargetFocus={props.openOnTargetFocus}
        minimal={props.minimal}
      >
        {props.children}
      </Tooltip>
      <TooltipStyles
        variant={props.variant}
        data-cy={props.cypressSelector}
        maxWidth={props.maxWidth}
        minWidth={props.minWidth}
      />
    </div>
  );
};

TooltipComponent.defaultProps = {
  position: Position.TOP,
  variant: "dark",
};

export default TooltipComponent;
