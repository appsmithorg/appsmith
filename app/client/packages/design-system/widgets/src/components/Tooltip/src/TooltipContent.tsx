import React, { forwardRef } from "react";

import { TooltipContent as HeadlessTooltipContent } from "@appsmith/wds-headless";
import type {
  TooltipContentProps as HeadlessTooltipContentProps,
  TooltipContentRef as HeadlessTooltipContentRef,
} from "@appsmith/wds-headless";
import { useThemeContext } from "@appsmith/wds-theming";

import { Text } from "../../Text";
import styles from "./styles.module.css";

const BORDER_RADIUS_THRESHOLD = 6;

const _TooltipContent = (
  props: HeadlessTooltipContentProps,
  ref: HeadlessTooltipContentRef,
) => {
  const { children, ...rest } = props;

  // We have to shift the arrow so that there is no empty space if the tooltip has rounding
  const theme = useThemeContext();
  const borderRadius = Number(
    (theme?.borderRadiusElevation?.[3].value as string).replace("px", ""),
  );
  const isRounded = borderRadius > BORDER_RADIUS_THRESHOLD;

  return (
    <HeadlessTooltipContent
      className={styles.tooltip}
      data-is-rounded={isRounded ? "" : undefined}
      ref={ref}
      {...rest}
    >
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </HeadlessTooltipContent>
  );
};

export const TooltipContent = forwardRef(_TooltipContent);
