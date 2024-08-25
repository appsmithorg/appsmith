import React from "react";
import RCTooltip from "rc-tooltip";

import type { TooltipProps } from "./Tooltip.types";
import "rc-tooltip/assets/bootstrap.css";
import "./Tooltip.css";
import { TooltipClassName } from "./Tooltip.constants";
import { Text } from "../Text";

function Tooltip(props: TooltipProps) {
  const { children, className, content, isDisabled = false, ...rest } = props;
  const disabledProps: { visible?: boolean } = {};
  if (isDisabled) {
    disabledProps["visible"] = false;
  }
  return (
    <RCTooltip
      mouseEnterDelay={0.5}
      overlay={
        <Text color="var(--tooltip-color)" kind="body-s">
          {content}
        </Text>
      }
      overlayClassName={`${TooltipClassName} ${className}`}
      {...rest}
      {...disabledProps}
    >
      {children}
    </RCTooltip>
  );
}

Tooltip.displayName = "Tooltip";

Tooltip.defaultProps = {
  placement: "top",
  trigger: ["hover"],
  showArrow: true,
};

export { Tooltip };
