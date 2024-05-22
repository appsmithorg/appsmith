import React from "react";
import { Icon, listItemStyles, Popover, Text } from "@design-system/widgets";
import {
  Menu as HeadlessMenu,
  MenuItem,
  Separator,
  SubmenuTrigger,
} from "react-aria-components";
import styles from "./styles.module.css";
import type { MenuProps, MenuItemProps } from "./types";

export const Menu = (props: MenuProps) => {
  const { hasSubmenu = false } = props;
  // place Popover in the root theme provider to get access to the CSS tokens
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <Popover UNSTABLE_portalContainer={hasSubmenu ? undefined : root}>
      <HeadlessMenu className={styles.menu} {...props}>
        {(item) => renderFunc(item, props)}
      </HeadlessMenu>
    </Popover>
  );
};

const renderFunc = (item: MenuItemProps, props: MenuProps) => {
  const {
    childItems,
    icon,
    id,
    isDisabled,
    isSeparator = false,
    label,
    ...rest
  } = item;

  if (childItems != null)
    return (
      <SubmenuTrigger {...rest}>
        <MenuItem
          className={listItemStyles.item}
          isDisabled={isDisabled}
          key={id}
        >
          {icon && <Icon name={icon} />}
          <Text className={listItemStyles.text} lineClamp={1}>
            {label}
          </Text>
          <Icon data-chevron name="chevron-right" size="small" />
        </MenuItem>
        <Menu {...props} hasSubmenu items={childItems}>
          {(item) => renderFunc(item, props)}
        </Menu>
      </SubmenuTrigger>
    );

  if (isSeparator)
    return <Separator className={listItemStyles.separator} key={id} />;

  return (
    <MenuItem className={listItemStyles.item} isDisabled={isDisabled} key={id}>
      {icon && <Icon name={icon} />}
      <Text className={listItemStyles.text} lineClamp={1}>
        {label}
      </Text>
    </MenuItem>
  );
};
