import type { PropsWithChildren } from "react";
import React, { useMemo } from "react";
import type { CommonComponentProps } from "../types/common";
import type { PopperBoundary } from "@blueprintjs/core/lib/esm/components/popover/popoverSharedProps";
import { PopoverPosition } from "@blueprintjs/core/lib/esm/components/popover/popoverSharedProps";
import { Tooltip } from "@blueprintjs/core/lib/esm/components/tooltip/tooltip";
import type { Modifiers } from "popper.js";
import type noop from "lodash/noop";
import "./styles.module.css";
import styled from "styled-components";

type Variant = "dark" | "light";

export const GLOBAL_STYLE_TOOLTIP_CLASSNAME = "ads-global-tooltip";

export type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  disabled?: boolean;
  position?: PopoverPosition;
  children: JSX.Element | React.ReactNode;
  variant?: Variant;
  maxWidth?: string;
  boundary?: PopperBoundary;
  minWidth?: string;
  openOnTargetFocus?: boolean;
  autoFocus?: boolean;
  hoverOpenDelay?: number;
  minimal?: boolean;
  modifiers?: Modifiers;
  isOpen?: boolean;
  onOpening?: typeof noop;
  popoverClassName?: string;
  donotUsePortal?: boolean;
  transitionDuration?: number;
  underline?: boolean;
  styles?: any;
};

const rootElementId = "tooltip-root";

let portalContainer = document.getElementById(rootElementId);

const TooltipWrapper = styled(Tooltip)<
  PropsWithChildren<{
    width?: string;
    underline?: boolean;
  }>
>`
  .bp3-popover-target {
    position: relative;
    cursor: ${({ underline }) => (underline ? "help" : "")};

    ${({ underline }) =>
      underline &&
      `
      &:after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        border-bottom: 1px dashed;
      }
    `}
  }
`;

if (!portalContainer) {
  const tooltipPortalElement = document.createElement("div");

  tooltipPortalElement.id = rootElementId;
  document.body.append(tooltipPortalElement);
  portalContainer = document.getElementById(rootElementId);
}

function TooltipComponent(props: TooltipProps) {
  const modifiers = useMemo(
    () => ({
      preventOverflow: { enabled: false },
      ...props.modifiers,
    }),
    [props.modifiers],
  );

  return (
    <TooltipWrapper
      autoFocus={props.autoFocus}
      boundary={props.boundary || "scrollParent"}
      className={props.className}
      content={props.content}
      disabled={props.disabled}
      hoverOpenDelay={props.hoverOpenDelay}
      isOpen={props.isOpen}
      minimal={props.minimal}
      modifiers={modifiers}
      onOpening={props.onOpening}
      openOnTargetFocus={props.openOnTargetFocus}
      popoverClassName={`${GLOBAL_STYLE_TOOLTIP_CLASSNAME} ${
        props.popoverClassName ?? ""
      }`}
      portalContainer={portalContainer as HTMLDivElement}
      position={props.position}
      transitionDuration={props.transitionDuration || 0}
      underline={props.underline}
      usePortal={!props.donotUsePortal}
      {...(props.styles || {})}
    >
      {props.children}
    </TooltipWrapper>
  );
}

TooltipComponent.defaultProps = {
  position: PopoverPosition.TOP,
  variant: "dark",
};

export default TooltipComponent;
