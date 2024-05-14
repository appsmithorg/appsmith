import React from "react";
import { MenuItem as HeadlessMenuItem, Separator } from "react-aria-components";
import { Icon, Text, listItemStyles } from "@design-system/widgets";
import type { MenuItemProps } from "./types";

export const MenuItem = (props: MenuItemProps) => {
  const { hasSubmenu = false, icon, id, isSeparator, label, ...rest } = props;

  if (Boolean(isSeparator)) {
    return <Separator className={listItemStyles.separator} />;
  }

  return (
    <HeadlessMenuItem
      {...rest}
      aria-label={hasSubmenu ? "Menu" : undefined}
      className={listItemStyles.item}
      // In order to use a submenu, we must use the key prop, otherwise it will not work.
      key={id}
    >
      {icon && <Icon name={icon} />}
      <Text
        className={listItemStyles.text}
        lineClamp={1}
        style={{ width: "100%" }}
      >
        {label}
      </Text>
      {Boolean(hasSubmenu) && (
        <Icon data-chevron name="chevron-right" size="small" />
      )}
    </HeadlessMenuItem>
  );
};
