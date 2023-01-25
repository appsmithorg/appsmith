import cx from "clsx";
import React, { CSSProperties, forwardRef } from "react";
import { createPolymorphicComponent } from "@mantine/utils";

import { Box } from "../Box";
import styles from "./styles.module.css";

export interface OverlayProps {
  /** Overlay background blur in px */
  blur?: number;

  /** Value from theme.radius or number to set border-radius in px */
  borderRadius?: CSSProperties["borderRadius"];

  /** className */
  className?: string;
}

export const _Overlay = forwardRef<HTMLDivElement, OverlayProps>(
  (props, ref) => {
    const { blur, borderRadius = 0, className, ...others } = props;
    const innerOverlay = (otherProps?: Record<string, any>) => (
      <Box className={cx(styles.root, className)} ref={ref} {...otherProps} />
    );

    if (blur) {
      return (
        <Box className={cx(styles.root, className)} {...others}>
          {innerOverlay()}
        </Box>
      );
    }

    return innerOverlay(others);
  },
);

_Overlay.displayName = "@mantine/core/Overlay";

export const Overlay = createPolymorphicComponent<"div", OverlayProps>(
  _Overlay,
);
