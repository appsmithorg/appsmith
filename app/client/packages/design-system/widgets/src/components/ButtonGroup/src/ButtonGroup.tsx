import React, { forwardRef, cloneElement } from "react";
import styles from "./styles.module.css";
import isArray from "lodash/isArray";

import type { Ref, ReactNode } from "react";
import type { ButtonGroupProps } from "./types";

const _ButtonGroup = (props: ButtonGroupProps, ref: Ref<HTMLDivElement>) => {
  const {
    children,
    color = "accent",
    orientation = "horizontal",
    variant = "filled",
    ...others
  } = props;

  const cloneChildren = (elements: ReactNode) => {
    if (isArray(elements)) {
      return elements.map((element) =>
        cloneElement(element, { variant, color }),
      );
    }
  };

  return (
    <div
      className={styles.buttonGroup}
      data-orientation={orientation}
      ref={ref}
      {...others}
    >
      {cloneChildren(children)}
    </div>
  );
};

export const ButtonGroup = forwardRef(_ButtonGroup);
