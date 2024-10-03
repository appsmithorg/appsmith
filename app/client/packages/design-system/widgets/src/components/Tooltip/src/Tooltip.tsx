import React from "react";
import {
  TooltipTrigger as AriaTooltipTrigger,
  Tooltip as AriaTooltip,
} from "react-aria-components";
import { Text } from "@appsmith/wds";
import { useThemeContext } from "@appsmith/wds-theming";

import type {
  TooltipProps as AriaTooltipProps,
  TooltipTriggerComponentProps as AriaTooltipTriggerProps,
} from "react-aria-components";

import styles from "./styles.module.css";

const BORDER_RADIUS_THRESHOLD = 6;

export interface TooltipProps extends AriaTooltipTriggerProps {
  tooltip?: React.ReactNode;
  children: JSX.Element;
  placement?: AriaTooltipProps["placement"];
  offset?: number;
}

export function Tooltip(props: TooltipProps) {
  const {
    children,
    closeDelay = 0,
    delay = 100,
    offset = 8,
    tooltip,
    ...rest
  } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  // We have to shift the arrow so that there is no empty space if the tooltip has rounding
  const theme = useThemeContext();
  const borderRadius = Number(
    (theme?.borderRadiusElevation?.[3].value as string).replace("px", ""),
  );
  const isRounded = borderRadius > BORDER_RADIUS_THRESHOLD;

  if (!Boolean(tooltip)) return children;

  return (
    <AriaTooltipTrigger {...rest} closeDelay={closeDelay} delay={delay}>
      {children}
      <AriaTooltip
        UNSTABLE_portalContainer={root}
        className={styles.tooltip}
        data-is-rounded={isRounded ? "" : undefined}
        offset={offset}
        placement={props.placement}
      >
        {typeof tooltip === "string" ? <Text>{tooltip}</Text> : tooltip}
        <span data-tooltip-trigger-arrow />
      </AriaTooltip>
    </AriaTooltipTrigger>
  );
}
