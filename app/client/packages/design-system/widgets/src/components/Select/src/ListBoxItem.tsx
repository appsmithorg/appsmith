import React from "react";

import clsx from "clsx";
import { ListBoxItem as HeadlessListBoxItem } from "react-aria-components";
import type { ListBoxItemProps } from "react-aria-components";

import { listItemStyles } from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";

export const ListBoxItem = (props: ListBoxItemProps) => {
  return (
    <HeadlessListBoxItem
      {...props}
      className={clsx(listItemStyles.item, getTypographyClassName("body"))}
    />
  );
};
