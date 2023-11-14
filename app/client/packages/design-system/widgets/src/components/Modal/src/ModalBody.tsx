import React from "react";
import styles from "./styles.module.css";

import type { ModalBodyProps } from "./types";

export const ModalBody = (props: ModalBodyProps) => {
  const { children } = props;

  return <div className={styles.body}>{children}</div>;
};
