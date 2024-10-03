import { clsx } from "clsx";
import React from "react";
import styles from "./styles.module.css";
import type { ChatTitleProps } from "./types";

export const ChatTitle = ({ className, title, ...rest }: ChatTitleProps) => {
  return (
    <div className={clsx(styles.root, className)} {...rest}>
      <div className={styles.logo} />
      {title}
    </div>
  );
};
