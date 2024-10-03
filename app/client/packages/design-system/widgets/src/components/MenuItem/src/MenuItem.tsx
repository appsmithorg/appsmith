import React from "react";
import { Icon, Text, listBoxItemStyles } from "@appsmith/wds";
import { MenuItem as AriaMenuItem } from "react-aria-components";

import type { MenuItemProps } from "./types";

export function MenuItem(props: MenuItemProps) {
  const { children, icon, isSubMenuItem, ...rest } = props;

  return (
    <AriaMenuItem {...rest} className={listBoxItemStyles.listBoxItem}>
      {icon && <Icon name={icon} />}
      <Text lineClamp={1}>{children}</Text>
      {Boolean(isSubMenuItem) && (
        <Icon data-submenu-icon="" name="chevron-right" />
      )}
    </AriaMenuItem>
  );
}
