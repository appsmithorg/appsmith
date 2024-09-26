import React from "react";
import { Icon, listItemStyles, Popover, Text } from "@appsmith/wds";
import {
  Menu as HeadlessMenu,
  MenuItem,
  Separator,
  SubmenuTrigger,
} from "react-aria-components";
import styles from "./styles.module.css";
import type { MenuProps, MenuItemProps } from "./types";
import type { Key } from "@react-types/shared";

export const Menu = (props: MenuProps) => {
  const { hasSubmenu = false } = props;
  // place Popover in the root theme provider to get access to the CSS tokens
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    // We should put only parent Popover in the root, if we put the child ones, then Menu will work incorrectly
    <Popover UNSTABLE_portalContainer={hasSubmenu ? undefined : root}>
      <HeadlessMenu className={styles.menu} {...props}>
        {(item) => renderFunc(item, props)}
      </HeadlessMenu>
    </Popover>
  );
};

const renderFunc = (item: MenuItemProps, props: MenuProps) => {
  const { childItems, icon, id, isDisabled, isSeparator = false, label } = item;

  const isItemDisabled = () =>
    Boolean((props.disabledKeys as Key[])?.includes(id)) || isDisabled;

  if (childItems != null)
    return (
      <SubmenuTrigger {...props}>
        <MenuItem
          className={listItemStyles.item}
          isDisabled={isItemDisabled()}
          key={id}
        >
          {icon && <Icon name={icon} />}
          <Text className={listItemStyles.text} lineClamp={1}>
            {label}
          </Text>
          <Icon data-chevron name="chevron-right" size="small" />
        </MenuItem>
        <Menu hasSubmenu items={childItems}>
          {(item) => renderFunc(item, props)}
        </Menu>
      </SubmenuTrigger>
    );

  if (isSeparator)
    return <Separator className={listItemStyles.separator} key={id} />;

  return (
    <MenuItem
      className={listItemStyles.item}
      isDisabled={isItemDisabled()}
      key={id}
    >
      {icon && <Icon name={icon} />}
      <Text className={listItemStyles.text} lineClamp={1}>
        {label}
      </Text>
    </MenuItem>
  );
};
