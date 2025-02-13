import React from "react";
import { Icon, Text } from "@appsmith/wds";
import { ListBoxItem as HeadlessListBoxItem } from "react-aria-components";

import styles from "./styles.module.css";
import type { ListBoxItemProps } from "./types";
import clsx from "clsx";

export function ListBoxItem(props: ListBoxItemProps) {
  const { children, className, icon, ...rest } = props;

  return (
    <HeadlessListBoxItem
      {...rest}
      className={clsx(styles.listBoxItem, className)}
    >
      {icon && <Icon name={icon} />}
      <Text lineClamp={1}>{children}</Text>
    </HeadlessListBoxItem>
  );
}
