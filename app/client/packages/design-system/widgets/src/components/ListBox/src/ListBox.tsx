import React from "react";
import styles from "./styles.module.css";
import { ListBox as HeadlessListBox } from "react-aria-components";

import type { ListBoxProps } from "./types";
import clsx from "clsx";

export function ListBox(props: ListBoxProps) {
  const { children, className, ...rest } = props;

  return (
    <HeadlessListBox {...rest} className={clsx(styles.listBox, className)}>
      {children}
    </HeadlessListBox>
  );
}
