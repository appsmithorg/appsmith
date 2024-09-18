import React from "react";
import styles from "./styles.module.css";
import clsx from "clsx";

import type { ModalContentProps } from "./types";

export const ModalContent = (props: ModalContentProps) => {
  const { children, className } = props;

  return <div className={clsx(styles.content, className)}>{children}</div>;
};
