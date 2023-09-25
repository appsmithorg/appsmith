import React, { forwardRef } from "react";
import styles from "./styles.module.css";

import type { ButtonGroupProps } from "./types";

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const { orientation = "horizontal", ...others } = props;

    return (
      <div
        className={styles.buttonGroup}
        data-orientation={orientation}
        ref={ref}
        {...others}
      />
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
