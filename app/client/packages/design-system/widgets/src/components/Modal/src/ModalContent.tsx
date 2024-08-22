import React from "react";

import clsx from "clsx";

import styles from "./styles.module.css";
import type { ModalContentProps } from "./types";

export const ModalContent = (props: ModalContentProps) => {
  const { children, className } = props;
  return <div className={clsx(styles.content, className)}>{children}</div>;
};
