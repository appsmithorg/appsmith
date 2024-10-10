import React from "react";
import { Icon, Text } from "@appsmith/wds";
import { ListBoxItem as HeadlessListBoxItem } from "react-aria-components";

import styles from "./styles.module.css";
import type { ListBoxItemProps } from "./types";

export function ListBoxItem(props: ListBoxItemProps) {
  const { children, icon, ...rest } = props;

  return (
    <HeadlessListBoxItem {...rest} className={styles.listBoxItem}>
      {icon && <Icon name={icon} />}
      <Text lineClamp={1}>{children}</Text>
    </HeadlessListBoxItem>
  );
}
