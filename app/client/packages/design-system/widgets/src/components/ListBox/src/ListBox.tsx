import React from "react";
import styles from "./styles.module.css";
import { ListBox as AriaListBox } from "react-aria-components";

import type { ListBoxProps } from "./types";

export function ListBox(props: ListBoxProps) {
  const { children, ...rest } = props;

  return (
    <AriaListBox {...rest} className={styles.listBox}>
      {children}
    </AriaListBox>
  );
}
