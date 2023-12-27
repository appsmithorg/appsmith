import React, { forwardRef } from "react";
import { ButtonGroupContext } from "./ButtonGroupContext";
import styles from "./styles.module.css";

import type { Ref } from "react";
import type { ButtonGroupProps } from "./types";

const _ButtonGroup = (props: ButtonGroupProps, ref: Ref<HTMLDivElement>) => {
  const {
    children,
    color = "accent",
    orientation = "horizontal",
    variant = "filled",
    ...others
  } = props;

  return (
    <ButtonGroupContext.Provider value={{ color, variant }}>
      <div
        className={styles.buttonGroup}
        data-orientation={orientation}
        ref={ref}
        {...others}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
};

export const ButtonGroup = forwardRef(_ButtonGroup);
