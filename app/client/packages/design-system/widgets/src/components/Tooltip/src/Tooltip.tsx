import React from "react";
import {
  TooltipTrigger as HeadlessTooltipTrigger,
  Tooltip as HeadlessTooltip,
} from "react-aria-components";
import { Text } from "@appsmith/wds";
import type {
  TooltipProps as HeadlessTooltipProps,
  TooltipTriggerComponentProps as HeadlessTooltipTriggerProps,
} from "react-aria-components";
import { useThemeContext } from "@appsmith/wds-theming";

import styles from "./styles.module.css";

const BORDER_RADIUS_THRESHOLD = 6;

export interface TooltipProps extends HeadlessTooltipTriggerProps {
  tooltip?: React.ReactNode;
  children: JSX.Element;
  placement?: HeadlessTooltipProps["placement"];
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
    <HeadlessTooltipTrigger {...rest} closeDelay={closeDelay} delay={delay}>
      {children}
      <HeadlessTooltip
        UNSTABLE_portalContainer={root}
        className={styles.tooltip}
        data-is-rounded={isRounded ? "" : undefined}
        offset={offset}
        placement={props.placement}
      >
        {typeof tooltip === "string" ? <Text>{tooltip}</Text> : tooltip}
        <span data-tooltip-trigger-arrow />
      </HeadlessTooltip>
    </HeadlessTooltipTrigger>
  );
}
