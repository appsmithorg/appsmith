import React from "react";
import { CommonComponentProps } from "./common";
import { Position, Tooltip, PopperBoundary } from "@blueprintjs/core";
import { GLOBAL_STYLE_TOOLTIP_CLASSNAME } from "globalStyles/tooltip";
import styled from "styled-components";
import { Modifiers } from "popper.js";
import { noop } from "lodash";

type Variant = "dark" | "light";

export type TooltipProps = CommonComponentProps & {
  content: JSX.Element | string;
  disabled?: boolean;
  position?: Position;
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
  donotUsePortal?: boolean;
  underline?: boolean;
};

const portalContainer = document.getElementById("tooltip-root");

const TooltipWrapper = styled(Tooltip)`
  display: flex;
  width: fit-content;
  text-align: center;
`;

const TooltipChildrenWrapper = styled.div<{ helpCursor: boolean }>`
  display: flex;
  position: relative;
  height: 100%;
  cursor: ${(props) => (props.helpCursor ? "help" : "")};
`;

const TooltipUnderline = styled.span`
  border-bottom: 1px dashed;
  width: 100%;
  display: flex;
  position: absolute;
  bottom: -1px;
`;

function TooltipComponent(props: TooltipProps) {
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
      modifiers={{
        preventOverflow: { enabled: false },
        ...props.modifiers,
      }}
      onOpening={props.onOpening}
      openOnTargetFocus={props.openOnTargetFocus}
      popoverClassName={GLOBAL_STYLE_TOOLTIP_CLASSNAME}
      portalContainer={portalContainer as HTMLDivElement}
      position={props.position}
      usePortal={!props.donotUsePortal}
    >
      <TooltipChildrenWrapper
        helpCursor={!!(!props.disabled && props.underline)}
      >
        {props.children}
        {!props.disabled && props.underline && (
          <TooltipUnderline className={"underline"} />
        )}
      </TooltipChildrenWrapper>
    </TooltipWrapper>
  );
}

TooltipComponent.defaultProps = {
  position: Position.TOP,
  variant: "dark",
};

export default TooltipComponent;
