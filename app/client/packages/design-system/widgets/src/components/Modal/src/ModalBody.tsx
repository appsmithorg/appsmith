import React from "react";
import styles from "./styles.module.css";

import type { ModalBodyProps } from "./types";
import clsx from "clsx";

export const ModalBody = (props: ModalBodyProps) => {
  const { children, className, style } = props;

  return (
    <div className={clsx(className, styles.body)} style={style}>
      {children}
    </div>
  );
};
