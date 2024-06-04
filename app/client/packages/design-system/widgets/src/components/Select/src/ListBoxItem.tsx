import React from "react";
import { ListBoxItem as HeadlessListBoxItem } from "react-aria-components";
import clsx from "clsx";
import { getTypographyClassName } from "@design-system/theming";
import { listItemStyles } from "@design-system/widgets";
import type { ListBoxItemProps } from "react-aria-components";

export const ListBoxItem = (props: ListBoxItemProps) => {
  return (
    <HeadlessListBoxItem
      {...props}
      className={clsx(listItemStyles.item, getTypographyClassName("body"))}
    />
  );
};
