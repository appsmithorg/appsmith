import React from "react";

import clsx from "clsx";

import styles from "./styles.module.css";
import type { ModalBodyProps } from "./types";

export const ModalBody = (props: ModalBodyProps) => {
  const { children, className, style } = props;

  return (
    <div className={clsx(className, styles.body)} style={style}>
      {children}
    </div>
  );
};
