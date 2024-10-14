import React from "react";
import {
  composeRenderProps,
  MenuItem as HeadlessMenuItem,
} from "react-aria-components";
import { Icon, Text, listBoxItemStyles } from "@appsmith/wds";

import type { MenuItemProps } from "./types";

export function MenuItem(props: MenuItemProps) {
  const { children, icon, ...rest } = props;

  return (
    <HeadlessMenuItem {...rest} className={listBoxItemStyles.listBoxItem}>
      {composeRenderProps(children, (children, { hasSubmenu }) => (
        <>
          {icon && <Icon name={icon} />}
          <Text lineClamp={1}>{children}</Text>
          {Boolean(hasSubmenu) && (
            <Icon data-submenu-icon="" name="chevron-right" />
          )}
        </>
      ))}
    </HeadlessMenuItem>
  );
}
